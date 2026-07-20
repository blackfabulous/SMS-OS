import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { fail } from '@/server/http'
import { requireContext } from '@/server/context'
import { canAccessStudent } from '@/server/student-access'
import { getReportCardData, handleReportsError } from '@/server/services/reports'

export async function GET(request: NextRequest) {
  const result = await requireContext()
  if ('error' in result) return result.error
  const { ctx } = result

  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const termId = searchParams.get('termId')

    if (!studentId) {
      return fail('VALIDATION', 'studentId query parameter is required')
    }

    // Ownership: staff may view any student in their school; a parent only their
    // children; a student only themselves. (Previously any authed user could
    // fetch ANY student's report card by id — cross-family PII leak.)
    if (!(await canAccessStudent(ctx, studentId))) {
      return fail('NOT_FOUND', 'Student not found')
    }

    const { student, school, term, currentEnrollment, primaryParent, reportCard, subjectsHtml: subjects, totalDays, daysPresent, daysAbsent, daysLate, totalScore: totalExamScore, avgScore } = await getReportCardData(ctx.schoolId, studentId, termId || null)

    const gradeColor = (g: string) => {
      if (g === 'A*' || g === 'A') return '#065f46'
      if (g === 'B') return '#0f766e'
      if (g === 'C') return '#92400e'
      if (g === 'D') return '#c2410c'
      return '#991b1b'
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Report Card - ${student.firstName} ${student.lastName}</title>
  <style>
    @page { margin: 1.2cm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11px;
      color: #1a1a1a;
      line-height: 1.5;
      background: #fff;
    }
    /* Zimbabwe flag accent strip at top */
    .zw-flag-strip {
      display: flex;
      height: 6px;
      width: 100%;
    }
    .zw-flag-strip .green { flex: 1; background: #006400; }
    .zw-flag-strip .yellow { flex: 1; background: #FFD700; }
    .zw-flag-strip .red { flex: 1; background: #DE2010; }
    .zw-flag-strip .black { flex: 1; background: #000000; }

    .report-card {
      max-width: 210mm;
      margin: 0 auto;
      border: 3px double #064e3b;
      padding: 18px;
    }
    .school-header {
      text-align: center;
      border-bottom: 3px double #064e3b;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .school-crest {
      width: 68px;
      height: 68px;
      border: 2px solid #064e3b;
      border-radius: 50%;
      margin: 0 auto 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #064e3b, #047857);
      color: white;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .school-name {
      font-size: 19px;
      font-weight: bold;
      color: #064e3b;
      letter-spacing: 1px;
    }
    .school-motto {
      font-style: italic;
      color: #6b7280;
      font-size: 10px;
      margin-top: 2px;
    }
    .school-details {
      font-size: 8.5px;
      color: #6b7280;
      margin-top: 3px;
    }
    .report-title {
      text-align: center;
      font-size: 13px;
      font-weight: bold;
      color: #064e3b;
      margin: 10px 0;
      padding: 5px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
    }
    .student-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
      margin-bottom: 14px;
      padding: 8px;
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
      margin-bottom: 10px;
      font-size: 10px;
    }
    th {
      background: #064e3b;
      color: white;
      padding: 5px 7px;
      text-align: center;
      font-weight: 600;
      font-size: 8.5px;
      text-transform: uppercase;
    }
    th:first-child { text-align: left; }
    td {
      padding: 4px 7px;
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
      padding: 1px 5px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 8.5px;
    }
    .section-title {
      font-size: 10.5px;
      font-weight: bold;
      color: #064e3b;
      margin: 12px 0 6px;
      padding-bottom: 2px;
      border-bottom: 1px solid #a7f3d0;
    }
    .behavior-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-bottom: 10px;
    }
    .behavior-item {
      text-align: center;
      padding: 5px;
      border: 1px solid #e5e7eb;
      border-radius: 3px;
    }
    .behavior-item .label {
      font-size: 8px;
      color: #6b7280;
      text-transform: uppercase;
    }
    .behavior-item .rating {
      font-size: 13px;
      font-weight: bold;
      color: #064e3b;
    }
    .attendance-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 10px;
    }
    .attendance-item {
      text-align: center;
      padding: 5px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 3px;
    }
    .comments-box {
      padding: 8px;
      border: 1px solid #e5e7eb;
      margin-bottom: 8px;
    }
    .comments-box .header {
      font-size: 9.5px;
      font-weight: bold;
      color: #064e3b;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .comments-box .text {
      font-style: italic;
      min-height: 24px;
    }
    .signature-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #d1d5db;
    }
    .signature-block {
      text-align: center;
    }
    .signature-line {
      border-bottom: 1px solid #1a1a1a;
      margin-top: 22px;
      margin-bottom: 3px;
    }
    .stamp-area {
      text-align: right;
      margin-top: 14px;
    }
    .stamp-circle {
      width: 72px;
      height: 72px;
      border: 2px dashed #9ca3af;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 7px;
      color: #9ca3af;
      text-transform: uppercase;
    }
    .next-term-info {
      margin-top: 10px;
      padding: 6px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      font-size: 9.5px;
    }
    .footer {
      text-align: center;
      margin-top: 12px;
      padding-top: 6px;
      border-top: 1px solid #d1d5db;
      font-size: 7.5px;
      color: #9ca3af;
    }
    /* Zimbabwe flag strip at bottom */
    .zw-flag-bottom {
      display: flex;
      height: 4px;
      width: 100%;
      margin-top: 8px;
    }
    .zw-flag-bottom .green { flex: 1; background: #006400; }
    .zw-flag-bottom .yellow { flex: 1; background: #FFD700; }
    .zw-flag-bottom .red { flex: 1; background: #DE2010; }
    .zw-flag-bottom .black { flex: 1; background: #000000; }

    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      .report-card { border-width: 2px; }
    }
  </style>
</head>
<body>
  <div class="report-card">
    <!-- Zimbabwe Flag Accent Strip -->
    <div class="zw-flag-strip">
      <div class="green"></div>
      <div class="yellow"></div>
      <div class="red"></div>
      <div class="black"></div>
    </div>

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
      <div class="field"><span class="label">Gender:</span> <span class="value">${student.gender === 'MALE' ? 'Male' : 'Female'}</span></div>
      <div class="field"><span class="label">Date of Birth:</span> <span class="value">${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-ZW') : 'N/A'}</span></div>
      <div class="field"><span class="label">Position:</span> <span class="value">${reportCard?.overallPosition ? '#' + reportCard.overallPosition : 'N/A'}</span></div>
      <div class="field"><span class="label">Parent/Guardian:</span> <span class="value">${primaryParent ? primaryParent.firstName + ' ' + primaryParent.lastName : 'N/A'}</span></div>
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
        ${subjects.map(s => `
        <tr>
          <td>${s.subject}</td>
          <td>${s.midTerm}</td>
          <td>${s.test}</td>
          <td style="font-weight:600">${s.exam}</td>
          <td><span class="grade-badge" style="background:${gradeColor(s.grade)}15;color:${gradeColor(s.grade)}">${s.grade}</span></td>
        </tr>`).join('')}
        <tr class="total-row">
          <td>TOTAL / AVERAGE</td>
          <td>${subjects.reduce((sum, s) => sum + (typeof s.midTerm === 'number' ? s.midTerm : 0), 0)}</td>
          <td>${subjects.reduce((sum, s) => sum + (typeof s.test === 'number' ? s.test : 0), 0)}</td>
          <td>${totalExamScore}</td>
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
        <div style="font-size:8px;color:#6b7280">Total Days</div>
        <div style="font-size:13px;font-weight:bold;color:#064e3b">${totalDays || 'N/A'}</div>
      </div>
      <div class="attendance-item">
        <div style="font-size:8px;color:#6b7280">Days Present</div>
        <div style="font-size:13px;font-weight:bold;color:#047857">${daysPresent || 'N/A'}</div>
      </div>
      <div class="attendance-item">
        <div style="font-size:8px;color:#6b7280">Days Absent</div>
        <div style="font-size:13px;font-weight:bold;color:#dc2626">${daysAbsent || 'N/A'}</div>
      </div>
      <div class="attendance-item">
        <div style="font-size:8px;color:#6b7280">Days Late</div>
        <div style="font-size:13px;font-weight:bold;color:#d97706">${daysLate || 'N/A'}</div>
      </div>
    </div>

    <div class="comments-box">
      <div class="header">Class Teacher's Comments</div>
      <div class="text">${reportCard?.classTeacherComment || 'A diligent learner who shows improvement in analytical subjects. Needs to focus more on problem-solving techniques.'}</div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:8.5px;color:#6b7280">
        <span>Class Teacher: ________________</span>
        <span>Date: ________________</span>
      </div>
    </div>

    <div class="comments-box">
      <div class="header">Headmaster's Comments</div>
      <div class="text">${reportCard?.headComment || 'Satisfactory progress. Continue working hard. Encouraged to seek extra help in weaker subjects.'}</div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:8.5px;color:#6b7280">
        <span>Headmaster: ________________</span>
        <span>Date: ________________</span>
      </div>
    </div>

    <div class="signature-row">
      <div class="signature-block">
        <div style="font-size:8.5px;color:#6b7280">Class Teacher's Signature</div>
        <div class="signature-line"></div>
      </div>
      <div class="signature-block">
        <div style="font-size:8.5px;color:#6b7280">Headmaster's Signature</div>
        <div class="signature-line"></div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:end;margin-top:14px">
      <div class="next-term-info">
        <strong>Next Term Opening Date:</strong> To be announced<br>
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

    <!-- Zimbabwe Flag Accent Strip Bottom -->
    <div class="zw-flag-bottom">
      <div class="green"></div>
      <div class="yellow"></div>
      <div class="red"></div>
      <div class="black"></div>
    </div>
  </div>

  <div class="no-print" style="text-align:center;margin-top:14px">
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
    const { code, message } = handleReportsError(error, 'Failed to generate report card')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
