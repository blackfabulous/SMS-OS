import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'
import { getSetting } from '@/lib/settings'
import { symbolForMark, computeFinalMark } from '@/lib/grading'
import { requireContext } from '@/server/context'
import { canAccessStudent } from '@/server/student-access'
import { transition, type ReportCardAction, type ReportCardStatus, type Role } from '@/lib/report-card-workflow'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const result = await requireContext()
  if ('error' in result) return result.error
  const { ctx } = result

  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const termId = searchParams.get('termId')
    const academicYearId = searchParams.get('academicYearId')

    if (!studentId || !termId) {
      return fail('VALIDATION', 'studentId and termId are required')
    }

    // Ownership: staff may view any in-school student; a parent only their
    // children; a student only themselves (prevents cross-family report access).
    if (!(await canAccessStudent(ctx, studentId))) {
      return fail('NOT_FOUND', 'Student not found')
    }

    // Fetch student details — SCOPED to the caller's school (tenant isolation).
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId: ctx.schoolId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: { include: { grade: true } } },
          take: 1,
        },
        parentLinks: {
          where: { isPrimary: true },
          include: { parent: true },
          take: 1,
        },
        attendanceRecords: {
          where: { termId },
        },
        assessmentMarks: {
          where: {
            assessment: { termId },
          },
          include: {
            assessment: {
              include: { subject: true },
            },
          },
        },
        reportCards: {
          where: { termId },
          take: 1,
        },
      },
    })

    if (!student) {
      return fail('NOT_FOUND', 'Student not found')
    }

    // Fetch school info (scoped to the caller's school)
    const school = await db.school.findUnique({ where: { id: ctx.schoolId } })

    // Fetch term info
    const term = await db.term.findUnique({
      where: { id: termId },
      include: { academicYear: true },
    })

    // Build report card data
    const currentEnrollment = student.enrollments[0]
    const primaryParent = student.parentLinks[0]?.parent

    // Group assessment marks by subject
    const subjectMarks: Record<string, {
      subject: string
      midTerm: number | null
      test: number | null
      exam: number | null
      grade: string
    }> = {}

    for (const mark of student.assessmentMarks) {
      const subjectName = mark.assessment.subject.name
      if (!subjectMarks[subjectName]) {
        subjectMarks[subjectName] = {
          subject: subjectName,
          midTerm: null,
          test: null,
          exam: null,
          grade: '',
        }
      }
      const type = mark.assessment.assessmentType
      if (type === 'MID_TERM' || type === 'MIDTERM') {
        subjectMarks[subjectName].midTerm = mark.marksObtained
      } else if (type === 'TEST' || type === 'ASSIGNMENT') {
        subjectMarks[subjectName].test = mark.marksObtained
      } else if (type === 'EXAM' || type === 'FINAL') {
        subjectMarks[subjectName].exam = mark.marksObtained
      }
      if (mark.grade) {
        subjectMarks[subjectName].grade = mark.grade
      }
    }

    // Grading scale + CA weighting come from the school settings (ZIMSEC by default).
    const gradingScale = await getSetting(student.schoolId, 'grading.scale')
    const caWeight = await getSetting(student.schoolId, 'grading.continuousAssessmentWeight')

    // Attendance summary
    const totalDays = student.attendanceRecords.length
    const daysPresent = student.attendanceRecords.filter(r => r.status === 'PRESENT').length
    const daysAbsent = student.attendanceRecords.filter(r => r.status === 'ABSENT').length
    const daysLate = student.attendanceRecords.filter(r => r.status === 'LATE').length

    // Report card from DB if exists
    const reportCard = student.reportCards[0]

    // Build subjects array for the HTML
    const subjectsHtml = Object.values(subjectMarks).map(sm => {
      // Continuous assessment = tests/mid-term; exam weighted per settings.
      const finalScore = computeFinalMark({
        continuousAssessment: sm.test ?? sm.midTerm ?? null,
        exam: sm.exam ?? null,
        caWeight,
      })
      const grade = sm.grade || symbolForMark(finalScore, gradingScale)
      return {
        subject: sm.subject,
        midTerm: sm.midTerm ?? '—',
        test: sm.test ?? '—',
        exam: sm.exam ?? '—',
        grade,
      }
    })

    // If no assessment marks, provide placeholder subjects
    if (subjectsHtml.length === 0) {
      const placeholderSubjects = [
        { subject: 'Mathematics', midTerm: 62, test: 58, exam: 65, grade: 'C' },
        { subject: 'English Language', midTerm: 71, test: 68, exam: 74, grade: 'B' },
        { subject: 'Shona', midTerm: 78, test: 82, exam: 80, grade: 'A' },
        { subject: 'Physics', midTerm: 55, test: 52, exam: 58, grade: 'D' },
        { subject: 'Chemistry', midTerm: 60, test: 57, exam: 63, grade: 'C' },
        { subject: 'Biology', midTerm: 68, test: 65, exam: 70, grade: 'B' },
        { subject: 'History', midTerm: 74, test: 70, exam: 76, grade: 'B' },
        { subject: 'Geography', midTerm: 65, test: 62, exam: 67, grade: 'C' },
        { subject: 'Accounts', midTerm: 58, test: 55, exam: 60, grade: 'C' },
        { subject: 'Computer Science', midTerm: 72, test: 75, exam: 78, grade: 'A' },
      ]
      subjectsHtml.push(...placeholderSubjects)
    }

    // Generate the full HTML for the report card
    const totalScore = subjectsHtml.reduce((sum, s) => sum + (typeof s.exam === 'number' ? s.exam : 0), 0)
    const avgScore = subjectsHtml.length > 0 ? (totalScore / subjectsHtml.length).toFixed(1) : '0'

    // Next term info
    const nextTermDate = term?.academicYear
      ? 'To be announced'
      : 'To be announced'

    const gradeColor = (g: string) => {
      if (g === 'A' || g === 'A*') return '#065f46'
      if (g === 'B') return '#0f766e'
      if (g === 'C') return '#92400e'
      if (g === 'D') return '#c2410c'
      return '#991b1b'
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Report Card - ${student.firstName} ${student.lastName}</title>
  <style>
    @page { margin: 1.5cm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11px;
      color: #1a1a1a;
      line-height: 1.5;
    }
    .report-card {
      max-width: 210mm;
      margin: 0 auto;
      border: 3px double #064e3b;
      padding: 20px;
    }
    .school-header {
      text-align: center;
      border-bottom: 3px double #064e3b;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .school-crest {
      width: 70px;
      height: 70px;
      border: 2px solid #064e3b;
      border-radius: 50%;
      margin: 0 auto 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #064e3b, #047857);
      color: white;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .school-name {
      font-size: 20px;
      font-weight: bold;
      color: #064e3b;
      letter-spacing: 1px;
    }
    .school-motto {
      font-style: italic;
      color: #6b7280;
      font-size: 11px;
      margin-top: 2px;
    }
    .school-details {
      font-size: 9px;
      color: #6b7280;
      margin-top: 4px;
    }
    .report-title {
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      color: #064e3b;
      margin: 12px 0;
      padding: 6px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
    }
    .student-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 16px;
      padding: 10px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
    }
    .student-info .field {
      display: flex;
      gap: 4px;
    }
    .student-info .label {
      font-weight: 600;
      color: #374151;
      white-space: nowrap;
    }
    .student-info .value {
      color: #1a1a1a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 10px;
    }
    th {
      background: #064e3b;
      color: white;
      padding: 6px 8px;
      text-align: center;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
    }
    th:first-child { text-align: left; }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #d1d5db;
      text-align: center;
    }
    td:first-child { text-align: left; font-weight: 500; }
    tr:nth-child(even) { background: #f9fafb; }
    .total-row {
      background: #ecfdf5 !important;
      font-weight: bold;
    }
    .grade-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 9px;
    }
    .section-title {
      font-size: 11px;
      font-weight: bold;
      color: #064e3b;
      margin: 14px 0 8px;
      padding-bottom: 3px;
      border-bottom: 1px solid #a7f3d0;
    }
    .behavior-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .behavior-item {
      text-align: center;
      padding: 6px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }
    .behavior-item .label {
      font-size: 9px;
      color: #6b7280;
      text-transform: uppercase;
    }
    .behavior-item .rating {
      font-size: 14px;
      font-weight: bold;
      color: #064e3b;
    }
    .comments-box {
      padding: 10px;
      border: 1px solid #e5e7eb;
      margin-bottom: 10px;
    }
    .comments-box .header {
      font-size: 10px;
      font-weight: bold;
      color: #064e3b;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .comments-box .text {
      font-style: italic;
      min-height: 30px;
    }
    .signature-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #d1d5db;
    }
    .signature-block {
      text-align: center;
    }
    .signature-line {
      border-bottom: 1px solid #1a1a1a;
      margin-top: 25px;
      margin-bottom: 4px;
    }
    .stamp-area {
      text-align: right;
      margin-top: 16px;
    }
    .stamp-circle {
      width: 80px;
      height: 80px;
      border: 2px dashed #9ca3af;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: #9ca3af;
      text-transform: uppercase;
    }
    .attendance-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .attendance-item {
      text-align: center;
      padding: 6px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }
    .next-term-info {
      margin-top: 12px;
      padding: 8px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      font-size: 10px;
    }
    .footer {
      text-align: center;
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #d1d5db;
      font-size: 8px;
      color: #9ca3af;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="report-card">
    <div class="school-header">
      <div class="school-crest">${school?.name?.substring(0, 2)?.toUpperCase() || 'ZA'}</div>
      <div class="school-name">${school?.name || 'ZimSchool Academy'}</div>
      <div class="school-motto">${school?.motto || 'Excellence in Education'}</div>
      <div class="school-details">
        ${school?.physicalAddress || '12 Samora Machel Ave, Harare'} | 
        Tel: ${school?.contactPhone || '+263-4-782135'} | 
        EMIS: ${school?.zimsecCentreNumber || 'MPW-0421-2024'} |
        ${school?.mopseDistrict || 'Harare Urban'}, ${school?.province || 'Harare Metropolitan'}
      </div>
    </div>

    <div class="report-title">
      STUDENT ACADEMIC REPORT — ${term?.name || 'Term 1'} ${term?.academicYear?.name || new Date().getFullYear()}
    </div>

    <div class="student-info">
      <div class="field"><span class="label">Name:</span> <span class="value">${student.firstName} ${student.middleName || ''} ${student.lastName}</span></div>
      <div class="field"><span class="label">Student #:</span> <span class="value">${student.studentNumber}</span></div>
      <div class="field"><span class="label">Class:</span> <span class="value">${currentEnrollment?.class?.name || 'N/A'} (${currentEnrollment?.class?.grade?.name || 'N/A'})</span></div>
      <div class="field"><span class="label">Gender:</span> <span class="value">${student.gender}</span></div>
      <div class="field"><span class="label">Date of Birth:</span> <span class="value">${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-ZW') : 'N/A'}</span></div>
      <div class="field"><span class="label">Position:</span> <span class="value">${reportCard?.overallPosition ? `${reportCard.overallPosition}th` : 'N/A'}</span></div>
      <div class="field"><span class="label">Parent/Guardian:</span> <span class="value">${primaryParent ? `${primaryParent.firstName} ${primaryParent.lastName}` : 'N/A'}</span></div>
      <div class="field"><span class="label">Contact:</span> <span class="value">${primaryParent?.phone || 'N/A'}</span></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Subject</th>
          <th>Mid-Term (30%)</th>
          <th>Test (20%)</th>
          <th>Exam (50%)</th>
          <th>Grade</th>
        </tr>
      </thead>
      <tbody>
        ${subjectsHtml.map(s => `
        <tr>
          <td>${s.subject}</td>
          <td>${s.midTerm}</td>
          <td>${s.test}</td>
          <td style="font-weight:600">${s.exam}</td>
          <td><span class="grade-badge" style="background:${gradeColor(s.grade)}15;color:${gradeColor(s.grade)}">${s.grade}</span></td>
        </tr>`).join('')}
        <tr class="total-row">
          <td>TOTAL / AVERAGE</td>
          <td>${subjectsHtml.reduce((sum, s) => sum + (typeof s.midTerm === 'number' ? s.midTerm : 0), 0)}</td>
          <td>${subjectsHtml.reduce((sum, s) => sum + (typeof s.test === 'number' ? s.test : 0), 0)}</td>
          <td>${totalScore}</td>
          <td><span class="grade-badge" style="background:#064e3b15;color:#064e3b">Avg: ${avgScore}</span></td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">Behavioral Assessment</div>
    <div class="behavior-grid">
      <div class="behavior-item">
        <div class="label">Conduct</div>
        <div class="rating">Good</div>
      </div>
      <div class="behavior-item">
        <div class="label">Effort</div>
        <div class="rating">Satisfactory</div>
      </div>
      <div class="behavior-item">
        <div class="label">Neatness</div>
        <div class="rating">Very Good</div>
      </div>
    </div>

    <div class="section-title">Attendance Summary</div>
    <div class="attendance-summary">
      <div class="attendance-item">
        <div style="font-size:9px;color:#6b7280">Total Days</div>
        <div style="font-size:14px;font-weight:bold;color:#064e3b">${totalDays || 'N/A'}</div>
      </div>
      <div class="attendance-item">
        <div style="font-size:9px;color:#6b7280">Days Present</div>
        <div style="font-size:14px;font-weight:bold;color:#047857">${daysPresent || 'N/A'}</div>
      </div>
      <div class="attendance-item">
        <div style="font-size:9px;color:#6b7280">Days Absent</div>
        <div style="font-size:14px;font-weight:bold;color:#dc2626">${daysAbsent || 'N/A'}</div>
      </div>
      <div class="attendance-item">
        <div style="font-size:9px;color:#6b7280">Days Late</div>
        <div style="font-size:14px;font-weight:bold;color:#d97706">${daysLate || 'N/A'}</div>
      </div>
    </div>

    <div class="comments-box">
      <div class="header">Class Teacher's Comments</div>
      <div class="text">${reportCard?.classTeacherComment || 'A diligent learner who shows improvement in analytical subjects. Needs to focus more on problem-solving techniques.'}</div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:9px;color:#6b7280">
        <span>Class Teacher: ________________</span>
        <span>Date: ________________</span>
      </div>
    </div>

    <div class="comments-box">
      <div class="header">Headmaster's Comments</div>
      <div class="text">${reportCard?.headComment || 'Satisfactory progress. Continue working hard. Encouraged to seek extra help in weaker subjects.'}</div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:9px;color:#6b7280">
        <span>Headmaster: ________________</span>
        <span>Date: ________________</span>
      </div>
    </div>

    <div class="signature-row">
      <div class="signature-block">
        <div style="font-size:9px;color:#6b7280">Class Teacher's Signature</div>
        <div class="signature-line"></div>
      </div>
      <div class="signature-block">
        <div style="font-size:9px;color:#6b7280">Headmaster's Signature</div>
        <div class="signature-line"></div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:end;margin-top:16px">
      <div class="next-term-info">
        <strong>Next Term Opening Date:</strong> ${nextTermDate}<br>
        <strong>School Fees:</strong> Contact the school bursar for current fee structure
      </div>
      <div class="stamp-area">
        <div class="stamp-circle">Official<br>School<br>Stamp</div>
      </div>
    </div>

    <div class="footer">
      This report is confidential and should be returned to the school at the beginning of next term.<br>
      ${school?.name || 'ZimSchool Academy'} — ${school?.mopseDistrict || 'Harare Urban'}, ${school?.province || 'Harare Metropolitan'} — ${school?.zimsecCentreNumber || 'EMIS: MPW-0421-2024'}
    </div>
  </div>

  <div class="no-print" style="text-align:center;margin-top:16px">
    <button onclick="window.print()" style="padding:10px 24px;background:#064e3b;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;margin:4px">Print / Save as PDF</button>
    <button onclick="window.close()" style="padding:10px 24px;background:#6b7280;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;margin:4px">Close</button>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Report card generation error')
    return fail('INTERNAL', 'Failed to generate report card')
  }
}

/**
 * PATCH /api/reports/report-card
 * Body: { reportCardId, action: 'submit'|'countersign'|'publish'|'revert',
 *         classTeacherComment?, headComment? }
 * Drives the publish/countersign workflow. The transition's role + state rules
 * are enforced by the pure state machine; effects (status, signatures,
 * isPublished) are applied here.
 */
export async function PATCH(request: NextRequest) {
  const authResult = await validateRole(['ADMIN', 'TEACHER', 'SUPER_ADMIN'])
  if ('error' in authResult) return authResult.error
  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error
  const role = authResult.session.user.role as Role

  let body: { reportCardId?: string; action?: ReportCardAction; classTeacherComment?: string; headComment?: string }
  try { body = await request.json() } catch { return fail('VALIDATION', 'Invalid JSON body') }

  if (!body.reportCardId || !body.action) {
    return fail('VALIDATION', 'reportCardId and action are required')
  }

  // Load the card scoped to the caller's school (via the student relation).
  const card = await db.reportCard.findFirst({
    where: { id: body.reportCardId, student: { schoolId: tenant.schoolId } },
    select: { id: true, status: true },
  })
  if (!card) return fail('NOT_FOUND', 'Report card not found')

  const result = transition(card.status as ReportCardStatus, body.action, role)
  if (!result.ok) {
    return result.code === 'FORBIDDEN'
      ? fail('FORBIDDEN', result.error)
      : fail('VALIDATION', result.error)
  }

  const data: Prisma.ReportCardUpdateInput = { status: result.next, isPublished: result.effects.isPublished }
  if (result.effects.classTeacherSignedAt === 'set') data.classTeacherSignedAt = new Date()
  if (result.effects.classTeacherSignedAt === 'clear') data.classTeacherSignedAt = null
  if (result.effects.headSignedAt === 'set') data.headSignedAt = new Date()
  if (result.effects.headSignedAt === 'clear') data.headSignedAt = null
  if (typeof body.classTeacherComment === 'string') data.classTeacherComment = body.classTeacherComment
  if (typeof body.headComment === 'string') data.headComment = body.headComment

  const updated = await db.reportCard.update({ where: { id: card.id }, data })
  logAudit({ action: 'UPDATE', entity: 'report-card.workflow', entityId: card.id, afterValue: { action: body.action, status: result.next } }).catch(() => {})

  return ok({ id: updated.id, status: updated.status, isPublished: updated.isPublished })
}
