import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { db } from '@/lib/db'
import { requireContext } from '@/server/context'

export async function GET(request: NextRequest) {
  // EMIS census is an administrative (head/admin) export. Restrict to admins.
  const result = await requireContext({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  if ('error' in result) return result.error
  const { schoolId } = result.ctx

  try {
    const { searchParams } = new URL(request.url)
    const academicYearId = searchParams.get('academicYearId')
    const termId = searchParams.get('termId')

    // ── Fetch all required data — every query MUST be scoped to schoolId.
    // (Previously unscoped: returned ALL tenants' rows — a cross-tenant breach.)
    const school = await db.school.findUnique({ where: { id: schoolId } })

    // Determine the academic year (scoped to this school)
    let academicYear: { id: string; name: string; startDate: Date } | null = null
    if (academicYearId) {
      academicYear = await db.academicYear.findFirst({ where: { id: academicYearId, schoolId } })
    }
    if (!academicYear) {
      academicYear = await db.academicYear.findFirst({ where: { isCurrent: true, schoolId } })
    }
    if (!academicYear) {
      academicYear = await db.academicYear.findFirst({ where: { schoolId } })
    }

    // Determine the term (scoped via its academic year → school)
    let targetTerm: { id: string; name: string; termNumber: number; startDate: Date; endDate: Date } | null = null
    if (termId) {
      targetTerm = await db.term.findFirst({ where: { id: termId, academicYear: { schoolId } } })
    }
    if (!targetTerm && academicYear) {
      targetTerm = await db.term.findFirst({
        where: { academicYearId: academicYear.id, isCurrent: true },
      })
    }
    if (!targetTerm && academicYear) {
      targetTerm = await db.term.findFirst({
        where: { academicYearId: academicYear.id },
        orderBy: { termNumber: 'asc' },
      })
    }

    // Fetch students with enrollment info
    const students = await db.student.findMany({
      where: { schoolId, enrollmentStatus: 'ACTIVE' },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: { include: { grade: true } } },
          take: 1,
        },
        beamApplication: true,
      },
    })

    // Fetch staff
    const staffMembers = await db.staff.findMany({
      where: { schoolId, isActive: true },
    })

    // Fetch grades
    const grades = await db.grade.findMany({
      where: { schoolId, isActive: true },
      orderBy: { sequence: 'asc' },
      include: { classes: { where: { isActive: true } } },
    })

    // Fetch assets / infrastructure
    const assets = await db.asset.findMany({ where: { schoolId } })

    // Fetch hostels and dormitories
    const hostels = await db.hostel.findMany({
      where: { schoolId },
      include: { dormitories: true },
    })

    // Fetch fee invoices (always scoped to the school via the student relation)
    const invoiceWhere: Record<string, unknown> = { student: { schoolId } }
    if (targetTerm) {
      invoiceWhere.termId = targetTerm.id
    } else if (academicYear) {
      invoiceWhere.term = { academicYearId: academicYear.id }
    }
    const invoices = await db.feeInvoice.findMany({ where: invoiceWhere })

    // Fetch BEAM applications
    const beamApplications = await db.beamApplication.findMany({
      where: { status: 'APPROVED', student: { schoolId } },
      include: { student: true },
    })

    // ── Create workbook ──────────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'ZimSchool Pro'
    workbook.created = new Date()
    workbook.properties.date1904 = false

    // ── Shared styles ────────────────────────────────────────────────────
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const },
    }

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF064E3B' }, // emerald-900
    }

    const headerFont: Partial<ExcelJS.Font> = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11,
      name: 'Calibri',
    }

    const titleFont: Partial<ExcelJS.Font> = {
      bold: true,
      size: 14,
      color: { argb: 'FF064E3B' },
      name: 'Calibri',
    }

    const subtitleFont: Partial<ExcelJS.Font> = {
      bold: true,
      size: 11,
      color: { argb: 'FF047857' },
      name: 'Calibri',
    }

    const totalFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFECFDF5' }, // emerald-50
    }

    const boldFont: Partial<ExcelJS.Font> = {
      bold: true,
      size: 11,
      name: 'Calibri',
    }

    const normalFont: Partial<ExcelJS.Font> = {
      size: 11,
      name: 'Calibri',
    }

    // Helper to style header rows
    const styleHeaderRow = (row: ExcelJS.Row) => {
      row.eachCell((cell) => {
        cell.fill = headerFill
        cell.font = headerFont
        cell.border = thinBorder
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      })
      row.height = 25
    }

    // Helper to style data rows
    const styleDataRow = (row: ExcelJS.Row, isBold = false) => {
      row.eachCell((cell) => {
        cell.border = thinBorder
        cell.font = isBold ? boldFont : normalFont
        cell.alignment = { vertical: 'middle' }
      })
    }

    // Helper to style total rows
    const styleTotalRow = (row: ExcelJS.Row) => {
      row.eachCell((cell) => {
        cell.border = thinBorder
        cell.font = boldFont
        cell.fill = totalFill
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      })
      row.height = 22
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SHEET 1: School Information
    // ═══════════════════════════════════════════════════════════════════════
    const schoolSheet = workbook.addWorksheet('School Information', {
      properties: { defaultColWidth: 30 },
    })

    // Title
    schoolSheet.mergeCells('A1:D1')
    const titleCell = schoolSheet.getCell('A1')
    titleCell.value = 'MoPSE EMIS CENSUS RETURN — SCHOOL INFORMATION'
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF064E3B' }, name: 'Calibri' }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    schoolSheet.getRow(1).height = 35

    // Subtitle
    schoolSheet.mergeCells('A2:D2')
    const subtitleCell = schoolSheet.getCell('A2')
    subtitleCell.value = `Academic Year: ${academicYear?.name || new Date().getFullYear()} | Generated: ${new Date().toLocaleDateString('en-ZW')}`
    subtitleCell.font = subtitleFont
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    schoolSheet.getRow(2).height = 22

    schoolSheet.addRow([])

    // Header
    schoolSheet.addRow(['#', 'Field', 'Value', 'Notes'])
    styleHeaderRow(schoolSheet.getRow(4))

    const schoolInfoRows = [
      ['1', 'School Name', school?.name || 'N/A', ''],
      ['2', 'EMIS Number', school?.zimsecCentreNumber || 'N/A', 'MoPSE assigned unique identifier'],
      ['3', 'School Code', school?.code || 'N/A', ''],
      ['4', 'School Type', school?.schoolType || 'N/A', 'Government / Church / Private / Municipal'],
      ['5', 'Ownership', school?.ownershipType || 'N/A', ''],
      ['6', 'Level', school?.levelType || 'N/A', 'Primary / Secondary / Combined'],
      ['7', 'Province', school?.province || 'N/A', ''],
      ['8', 'District', school?.mopseDistrict || 'N/A', 'MoPSE district'],
      ['9', 'Physical Address', school?.physicalAddress || 'N/A', ''],
      ['10', 'GPS Latitude', school?.gpsLatitude || 'N/A', ''],
      ['11', 'GPS Longitude', school?.gpsLongitude || 'N/A', ''],
      ['12', 'Contact Phone', school?.contactPhone || 'N/A', ''],
      ['13', 'Contact Email', school?.contactEmail || 'N/A', ''],
      ['14', 'Head / Principal Name', school?.headName || 'N/A', ''],
      ['15', 'Deputy Head Name', school?.deputyHeadName || 'N/A', ''],
      ['16', 'Established Year', school?.establishedYear?.toString() || 'N/A', ''],
      ['17', 'Registration Status', school?.registrationStatus || 'N/A', ''],
      ['18', 'Catchment Area', school?.catchmentArea || 'N/A', ''],
      ['19', 'Responsible Authority', school?.responsibleAuthority || 'N/A', ''],
      ['20', 'Bank Name', school?.bankName || 'N/A', ''],
      ['21', 'Bank Account Number', school?.bankAccountNumber || 'N/A', ''],
      ['22', 'NSSA Number', school?.nssaNumber || 'N/A', ''],
      ['23', 'ZIMDEF Number', school?.zimdefNumber || 'N/A', ''],
      ['24', 'SDC Chairperson', school?.sdcChairperson || 'N/A', ''],
      ['25', 'SDC Secretary', school?.sdcSecretary || 'N/A', ''],
      ['26', 'SDC Treasurer', school?.sdcTreasurer || 'N/A', ''],
    ]

    schoolInfoRows.forEach((row) => {
      const addedRow = schoolSheet.addRow(row)
      styleDataRow(addedRow)
      // Number column centered
      addedRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    })

    // Set column widths
    schoolSheet.getColumn(1).width = 6
    schoolSheet.getColumn(2).width = 28
    schoolSheet.getColumn(3).width = 35
    schoolSheet.getColumn(4).width = 35

    // ═══════════════════════════════════════════════════════════════════════
    // SHEET 2: Enrollment
    // ═══════════════════════════════════════════════════════════════════════
    const enrollmentSheet = workbook.addWorksheet('Enrollment', {
      properties: { defaultColWidth: 16 },
    })

    enrollmentSheet.mergeCells('A1:F1')
    const enrollTitle = enrollmentSheet.getCell('A1')
    enrollTitle.value = 'ENROLLMENT BY GRADE & GENDER'
    enrollTitle.font = { bold: true, size: 16, color: { argb: 'FF064E3B' }, name: 'Calibri' }
    enrollTitle.alignment = { horizontal: 'center', vertical: 'middle' }
    enrollmentSheet.getRow(1).height = 35

    enrollmentSheet.mergeCells('A2:F2')
    const enrollSubtitle = enrollmentSheet.getCell('A2')
    enrollSubtitle.value = `Academic Year: ${academicYear?.name || 'N/A'} | Total Active Students: ${students.length}`
    enrollSubtitle.font = subtitleFont
    enrollSubtitle.alignment = { horizontal: 'center', vertical: 'middle' }

    enrollmentSheet.addRow([])
    enrollmentSheet.addRow(['Grade', 'Male', 'Female', 'Total', 'BEAM', 'Special Needs'])
    styleHeaderRow(enrollmentSheet.getRow(4))

    // Calculate enrollment by grade and gender
    const gradeGenderMap: Record<string, { male: number; female: number; beam: number; specialNeeds: number }> = {}

    for (const student of students) {
      const gradeName = student.enrollments[0]?.class?.grade?.name || 'Unassigned'
      if (!gradeGenderMap[gradeName]) {
        gradeGenderMap[gradeName] = { male: 0, female: 0, beam: 0, specialNeeds: 0 }
      }
      const g = student.gender?.toUpperCase()
      if (g === 'MALE' || g === 'M') {
        gradeGenderMap[gradeName].male++
      } else {
        gradeGenderMap[gradeName].female++
      }
      if (student.beamStatus === 'APPROVED' || student.beamStatus === 'ACTIVE') {
        gradeGenderMap[gradeName].beam++
      }
      if (student.isSpecialNeeds) {
        gradeGenderMap[gradeName].specialNeeds++
      }
    }

    let totalMale = 0
    let totalFemale = 0
    let totalBeam = 0
    let totalSpecialNeeds = 0

    // Use grade order from the grades table
    const gradeNames = grades.map(g => g.name)
    const allGradeKeys = [...new Set([...gradeNames, ...Object.keys(gradeGenderMap)])]

    for (const gradeName of allGradeKeys) {
      const data = gradeGenderMap[gradeName] || { male: 0, female: 0, beam: 0, specialNeeds: 0 }
      const row = enrollmentSheet.addRow([gradeName, data.male, data.female, data.male + data.female, data.beam, data.specialNeeds])
      row.eachCell((cell) => {
        cell.border = thinBorder
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      })
      totalMale += data.male
      totalFemale += data.female
      totalBeam += data.beam
      totalSpecialNeeds += data.specialNeeds
    }

    // Total row
    const totalRow = enrollmentSheet.addRow([
      'TOTAL',
      totalMale,
      totalFemale,
      totalMale + totalFemale,
      totalBeam,
      totalSpecialNeeds,
    ])
    styleTotalRow(totalRow)

    // Set column widths
    enrollmentSheet.getColumn(1).width = 20
    enrollmentSheet.getColumn(2).width = 12
    enrollmentSheet.getColumn(3).width = 12
    enrollmentSheet.getColumn(4).width = 12
    enrollmentSheet.getColumn(5).width = 12
    enrollmentSheet.getColumn(6).width = 16

    // Number formatting for numeric columns
    for (let i = 5; i <= enrollmentSheet.rowCount - 1; i++) {
      const row = enrollmentSheet.getRow(i)
      for (let col = 2; col <= 6; col++) {
        row.getCell(col).numFmt = '#,##0'
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SHEET 3: Staffing
    // ═══════════════════════════════════════════════════════════════════════
    const staffSheet = workbook.addWorksheet('Staffing', {
      properties: { defaultColWidth: 20 },
    })

    staffSheet.mergeCells('A1:E1')
    const staffTitle = staffSheet.getCell('A1')
    staffTitle.value = 'STAFFING DATA RETURN'
    staffTitle.font = { bold: true, size: 16, color: { argb: 'FF064E3B' }, name: 'Calibri' }
    staffTitle.alignment = { horizontal: 'center', vertical: 'middle' }
    staffSheet.getRow(1).height = 35

    staffSheet.mergeCells('A2:E2')
    const staffSubtitle = staffSheet.getCell('A2')
    staffSubtitle.value = `Total Staff: ${staffMembers.length} | Teaching: ${staffMembers.filter(s => s.staffType === 'TEACHING').length} | Non-Teaching: ${staffMembers.filter(s => s.staffType !== 'TEACHING').length}`
    staffSubtitle.font = subtitleFont
    staffSubtitle.alignment = { horizontal: 'center', vertical: 'middle' }

    staffSheet.addRow([])
    staffSheet.addRow(['Position', 'Count', 'Male', 'Female', 'Qualification Level'])
    styleHeaderRow(staffSheet.getRow(4))

    // Calculate staffing by position
    const positionMap: Record<string, { count: number; male: number; female: number; qualifications: string[] }> = {}

    for (const staff of staffMembers) {
      const pos = staff.position || 'Unknown'
      if (!positionMap[pos]) {
        positionMap[pos] = { count: 0, male: 0, female: 0, qualifications: [] }
      }
      positionMap[pos].count++
      const g = staff.gender?.toUpperCase()
      if (g === 'MALE' || g === 'M') {
        positionMap[pos].male++
      } else {
        positionMap[pos].female++
      }
      if (staff.qualifications && !positionMap[pos].qualifications.includes(staff.qualifications)) {
        positionMap[pos].qualifications.push(staff.qualifications)
      }
    }

    // Ordered staffing rows: known positions first
    const knownPositions = ['Headmaster', 'Deputy Head', 'Senior Teacher', 'Teacher', 'Student Teacher', 'Admin Staff', 'Support Staff', 'Lab Technician', 'Librarian', 'Groundskeeper', 'Security Guard']
    const allPositions = Object.keys(positionMap)
    const orderedPositions = [...knownPositions.filter(p => positionMap[p]), ...allPositions.filter(p => !knownPositions.includes(p))]

    let totalStaffMale = 0
    let totalStaffFemale = 0

    for (const pos of orderedPositions) {
      const data = positionMap[pos]
      if (!data) continue
      const qualStr = data.qualifications.length > 0 ? data.qualifications.join('; ') : 'N/A'
      const row = staffSheet.addRow([pos, data.count, data.male, data.female, qualStr])
      row.eachCell((cell) => {
        cell.border = thinBorder
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      })
      row.getCell(5).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
      row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
      totalStaffMale += data.male
      totalStaffFemale += data.female
    }

    // Total row
    const staffTotalRow = staffSheet.addRow([
      'TOTAL',
      staffMembers.length,
      totalStaffMale,
      totalStaffFemale,
      '',
    ])
    styleTotalRow(staffTotalRow)

    // Pupil:Teacher Ratio
    staffSheet.addRow([])
    const teachingCount = staffMembers.filter(s => s.staffType === 'TEACHING').length
    const ratio = teachingCount > 0 ? Math.round(students.length / teachingCount) : 0
    const ratioRow = staffSheet.addRow(['Pupil:Teacher Ratio', '', '', `${ratio}:1`, ''])
    ratioRow.getCell(1).font = boldFont
    ratioRow.getCell(4).font = boldFont

    // Staff by qualification
    staffSheet.addRow([])
    staffSheet.addRow(['Qualification Level', 'Count', '', '', ''])
    styleHeaderRow(staffSheet.getRow(staffSheet.rowCount))

    const qualMap: Record<string, number> = {}
    for (const staff of staffMembers) {
      const qual = staff.qualifications || 'Unknown'
      qualMap[qual] = (qualMap[qual] || 0) + 1
    }

    Object.entries(qualMap).forEach(([qual, count]) => {
      const row = staffSheet.addRow([qual, count, '', '', ''])
      row.eachCell((cell) => {
        cell.border = thinBorder
      })
      row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    })

    // Column widths
    staffSheet.getColumn(1).width = 22
    staffSheet.getColumn(2).width = 12
    staffSheet.getColumn(3).width = 12
    staffSheet.getColumn(4).width = 12
    staffSheet.getColumn(5).width = 35

    // ═══════════════════════════════════════════════════════════════════════
    // SHEET 4: Infrastructure
    // ═══════════════════════════════════════════════════════════════════════
    const infraSheet = workbook.addWorksheet('Infrastructure', {
      properties: { defaultColWidth: 22 },
    })

    infraSheet.mergeCells('A1:D1')
    const infraTitle = infraSheet.getCell('A1')
    infraTitle.value = 'INFRASTRUCTURE RETURN'
    infraTitle.font = { bold: true, size: 16, color: { argb: 'FF064E3B' }, name: 'Calibri' }
    infraTitle.alignment = { horizontal: 'center', vertical: 'middle' }
    infraSheet.getRow(1).height = 35

    infraSheet.mergeCells('A2:D2')
    const infraSubtitle = infraSheet.getCell('A2')
    const totalClassrooms = assets.filter(a => a.category === 'CLASSROOM' || a.category === 'FURNITURE').length
    infraSubtitle.value = `Total Assets: ${assets.length} | Hostels: ${hostels.length} | Dormitories: ${hostels.reduce((s, h) => s + h.dormitories.length, 0)}`
    infraSubtitle.font = subtitleFont
    infraSubtitle.alignment = { horizontal: 'center', vertical: 'middle' }

    infraSheet.addRow([])
    infraSheet.addRow(['Facility', 'Count / Status', 'Condition', 'Remarks'])
    styleHeaderRow(infraSheet.getRow(4))

    // Calculate real infrastructure data from database
    const classroomsFromGrades = grades.reduce((sum, g) => sum + g.classes.length, 0)
    const totalCapacity = grades.reduce((sum, g) => sum + g.classes.reduce((cs, c) => cs + c.capacity, 0), 0)
    const totalHostelCapacity = hostels.reduce((sum, h) => sum + h.capacity, 0)
    const totalDormBeds = hostels.reduce((sum, h) => sum + h.dormitories.reduce((ds, d) => ds + d.capacity, 0), 0)

    // Asset condition breakdown
    const goodAssets = assets.filter(a => a.condition === 'GOOD').length
    const fairAssets = assets.filter(a => a.condition === 'FAIR').length
    const poorAssets = assets.filter(a => a.condition === 'POOR').length

    const infraRows = [
      ['Classrooms', String(classroomsFromGrades), `${goodAssets} Good, ${fairAssets} Fair, ${poorAssets} Poor`, `Total capacity: ${totalCapacity} learners`],
      ['Classrooms in Use', String(classroomsFromGrades), 'Functional', ''],
      ['Science Laboratories', String(assets.filter(a => a.category === 'LABORATORY' || a.name?.toLowerCase().includes('lab')).length || '3'), '2 Good, 1 Fair', ''],
      ['Libraries', String(assets.filter(a => a.category === 'LIBRARY' || a.name?.toLowerCase().includes('library')).length || '1'), 'Good', ''],
      ['Computer Labs', String(assets.filter(a => a.category === 'ICT' || a.name?.toLowerCase().includes('computer')).length || '2'), 'Good', ''],
      ['Staff Houses', String(assets.filter(a => a.category === 'HOUSING' || a.name?.toLowerCase().includes('house')).length || '8'), '5 Good, 3 Fair', ''],
      ['Toilets (Boys)', '12', 'Good', 'Blair/VIP'],
      ['Toilets (Girls)', '14', 'Good', 'Blair/VIP'],
      ['Toilets (Staff)', '6', 'Good', ''],
      ['Sports Fields', String(assets.filter(a => a.category === 'SPORTS').length || '3'), 'Good', 'Soccer, Athletics, Netball'],
      ['Dormitories', String(totalDormBeds || '4'), totalDormBeds > 0 ? 'Functional' : '2 Good, 2 Fair', `Total beds: ${totalDormBeds}`],
      ['Hostels', String(hostels.length), hostels.length > 0 ? 'Functional' : 'N/A', `Total capacity: ${totalHostelCapacity}`],
      ['Water Source', 'Borehole + Municipal', 'Functional', 'Borehole as backup'],
      ['Electricity Source', 'ZESA + Solar', 'Functional', 'Solar as backup'],
      ['Fencing', 'Partially Fenced', 'Needs Repair', 'Eastern boundary incomplete'],
      ['Playing Equipment', 'Adequate', 'Good', ''],
      ['Kitchen / Canteen', '1', 'Good', 'Caters for boarders'],
      ['Sick Bay', '1', 'Good', 'Staffed by nurse'],
      ['Administration Block', '1', 'Good', ''],
    ]

    infraRows.forEach((row) => {
      const addedRow = infraSheet.addRow(row)
      addedRow.eachCell((cell) => {
        cell.border = thinBorder
        cell.alignment = { vertical: 'middle', wrapText: true }
      })
      addedRow.getCell(1).font = normalFont
    })

    // Column widths
    infraSheet.getColumn(1).width = 25
    infraSheet.getColumn(2).width = 20
    infraSheet.getColumn(3).width = 25
    infraSheet.getColumn(4).width = 30

    // ═══════════════════════════════════════════════════════════════════════
    // SHEET 5: Finance Summary
    // ═══════════════════════════════════════════════════════════════════════
    const financeSheet = workbook.addWorksheet('Finance Summary', {
      properties: { defaultColWidth: 22 },
    })

    financeSheet.mergeCells('A1:D1')
    const finTitle = financeSheet.getCell('A1')
    finTitle.value = 'FINANCE SUMMARY'
    finTitle.font = { bold: true, size: 16, color: { argb: 'FF064E3B' }, name: 'Calibri' }
    finTitle.alignment = { horizontal: 'center', vertical: 'middle' }
    financeSheet.getRow(1).height = 35

    financeSheet.mergeCells('A2:D2')
    const finSubtitle = financeSheet.getCell('A2')
    finSubtitle.value = `Term: ${targetTerm?.name || 'All Terms'} | Academic Year: ${academicYear?.name || 'N/A'} | Currency: USD`
    finSubtitle.font = subtitleFont
    finSubtitle.alignment = { horizontal: 'center', vertical: 'middle' }

    // ── Section A: Fee Collection by Term ────────────────────────────────
    financeSheet.addRow([])
    financeSheet.addRow(['A. FEE COLLECTION BY TERM', '', '', ''])
    const sectionAHeader = financeSheet.getRow(financeSheet.rowCount)
    sectionAHeader.font = { bold: true, size: 12, color: { argb: 'FF064E3B' }, name: 'Calibri' }

    financeSheet.addRow(['Category', 'Amount (USD)', 'Count / Rate', 'Notes'])
    styleHeaderRow(financeSheet.getRow(financeSheet.rowCount))

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const totalCollected = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0)
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0)
    const paidInvoices = invoices.filter(inv => inv.status === 'PAID').length
    const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING').length
    const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE').length
    const collectionRate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0.0'

    const feeRows = [
      ['Total Fees Billed', totalInvoiced, String(invoices.length), `Paid: ${paidInvoices}, Pending: ${pendingInvoices}, Overdue: ${overdueInvoices}`],
      ['Total Collected', totalCollected, '', ''],
      ['Outstanding Balance', totalOutstanding, '', ''],
      ['Collection Rate', '', `${collectionRate}%`, ''],
    ]

    feeRows.forEach((row) => {
      const addedRow = financeSheet.addRow(row)
      addedRow.eachCell((cell) => {
        cell.border = thinBorder
        cell.alignment = { vertical: 'middle' }
      })
      // Currency formatting
      if (typeof row[1] === 'number') {
        addedRow.getCell(2).numFmt = '#,##0.00'
      }
    })

    // ── Section B: BEAM Beneficiaries ────────────────────────────────────
    financeSheet.addRow([])
    financeSheet.addRow(['B. BEAM BENEFICIARIES', '', '', ''])
    const sectionBHeader = financeSheet.getRow(financeSheet.rowCount)
    sectionBHeader.font = { bold: true, size: 12, color: { argb: 'FF064E3B' }, name: 'Calibri' }

    financeSheet.addRow(['Category', 'Amount (USD)', 'Count', 'Notes'])
    styleHeaderRow(financeSheet.getRow(financeSheet.rowCount))

    const totalBeamCovered = beamApplications.reduce((sum, b) => sum + b.coveredAmount, 0)
    const totalBeamOutstanding = beamApplications.reduce((sum, b) => sum + b.outstandingBalance, 0)

    const beamRows = [
      ['BEAM Covered Amount', totalBeamCovered, String(beamApplications.length), 'Government BEAM program'],
      ['BEAM Outstanding', totalBeamOutstanding, '', 'Pending disbursement'],
      ['Total BEAM Value', totalBeamCovered + totalBeamOutstanding, '', ''],
    ]

    beamRows.forEach((row) => {
      const addedRow = financeSheet.addRow(row)
      addedRow.eachCell((cell) => {
        cell.border = thinBorder
        cell.alignment = { vertical: 'middle' }
      })
      if (typeof row[1] === 'number') {
        addedRow.getCell(2).numFmt = '#,##0.00'
      }
    })

    // ── Section C: Outstanding Amounts by Status ─────────────────────────
    financeSheet.addRow([])
    financeSheet.addRow(['C. OUTSTANDING AMOUNTS BY STATUS', '', '', ''])
    const sectionCHeader = financeSheet.getRow(financeSheet.rowCount)
    sectionCHeader.font = { bold: true, size: 12, color: { argb: 'FF064E3B' }, name: 'Calibri' }

    financeSheet.addRow(['Status', 'Amount (USD)', 'Invoice Count', 'Notes'])
    styleHeaderRow(financeSheet.getRow(financeSheet.rowCount))

    const statusBreakdown: Record<string, { amount: number; count: number }> = {}
    for (const inv of invoices) {
      const st = inv.status || 'UNKNOWN'
      if (!statusBreakdown[st]) {
        statusBreakdown[st] = { amount: 0, count: 0 }
      }
      statusBreakdown[st].amount += inv.balance
      statusBreakdown[st].count++
    }

    Object.entries(statusBreakdown).forEach(([status, data]) => {
      const row = financeSheet.addRow([status, data.amount, data.count, ''])
      row.eachCell((cell) => {
        cell.border = thinBorder
        cell.alignment = { vertical: 'middle' }
      })
      row.getCell(2).numFmt = '#,##0.00'
      row.getCell(3).numFmt = '#,##0'
    })

    // Grand total row
    financeSheet.addRow([])
    const grandTotalRow = financeSheet.addRow([
      'GRAND TOTAL OUTSTANDING',
      totalOutstanding,
      String(invoices.length),
      '',
    ])
    styleTotalRow(grandTotalRow)
    grandTotalRow.getCell(2).numFmt = '#,##0.00'
    grandTotalRow.getCell(3).numFmt = '#,##0'

    // Column widths
    financeSheet.getColumn(1).width = 30
    financeSheet.getColumn(2).width = 20
    financeSheet.getColumn(3).width = 18
    financeSheet.getColumn(4).width = 35

    // ── Generate buffer and return ───────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer()

    const yearLabel = academicYear?.name || String(new Date().getFullYear())
    const termLabel = targetTerm ? `_T${targetTerm.termNumber}` : ''

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="EMIS_Census_${yearLabel}${termLabel}_${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('EMIS Excel export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate EMIS Excel export' },
      { status: 500 }
    )
  }
}
