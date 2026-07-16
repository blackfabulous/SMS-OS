import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { fail } from '@/server/http'
import { requireContext } from '@/server/context'

export async function GET() {
  // EMIS census is an administrative (head/admin) export. Restrict to admins.
  const result = await requireContext({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  if ('error' in result) return result.error
  const { schoolId } = result.ctx

  try {
    // Fetch school data — every query MUST be scoped to schoolId. (Previously
    // unscoped: findFirst() returned an arbitrary school and the rest returned
    // ALL tenants' rows — a cross-tenant data breach.)
    const school = await db.school.findUnique({ where: { id: schoolId } })
    const students = await db.student.findMany({
      where: { schoolId, enrollmentStatus: 'ACTIVE' },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: { include: { grade: true } } },
          take: 1,
        },
      },
    })
    const staffMembers = await db.staff.findMany({
      where: { schoolId, isActive: true },
    })
    const assets = await db.asset.findMany({ where: { schoolId } })
    const invoices = await db.feeInvoice.findMany({ where: { student: { schoolId } } })

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'ZimSchool Pro'
    workbook.created = new Date()

    // Helper for borders
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const },
    }

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF064E3B' },
    }

    const headerFont: Partial<ExcelJS.Font> = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11,
    }

    // ─── Sheet 1: School Information ─────────────────────────────────────
    const schoolSheet = workbook.addWorksheet('School Information', {
      properties: { defaultColWidth: 30 },
    })

    // Title row
    schoolSheet.mergeCells('A1:C1')
    const titleCell = schoolSheet.getCell('A1')
    titleCell.value = 'MoPSE EMIS CENSUS RETURN - SCHOOL INFORMATION'
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF064E3B' } }
    titleCell.alignment = { horizontal: 'center' }

    // Year row
    schoolSheet.mergeCells('A2:C2')
    const yearCell = schoolSheet.getCell('A2')
    yearCell.value = `Academic Year: ${new Date().getFullYear()}`
    yearCell.font = { bold: true, size: 11, color: { argb: 'FF047857' } }
    yearCell.alignment = { horizontal: 'center' }

    schoolSheet.addRow([])
    schoolSheet.addRow(['Field', 'Value', 'Notes'])
    const headerRow1 = schoolSheet.getRow(4)
    headerRow1.eachCell((cell) => {
      cell.fill = headerFill
      cell.font = headerFont
      cell.border = thinBorder
      cell.alignment = { horizontal: 'center' }
    })

    const schoolInfoRows = [
      ['School Name', school?.name || 'N/A', ''],
      ['EMIS Number', school?.zimsecCentreNumber || 'N/A', 'MoPSE assigned'],
      ['School Type', school?.schoolType || 'N/A', 'Government/Church/Private'],
      ['Ownership', school?.ownershipType || 'N/A', ''],
      ['Level', school?.levelType || 'N/A', 'Primary/Secondary'],
      ['Province', school?.province || 'N/A', ''],
      ['District', school?.mopseDistrict || 'N/A', ''],
      ['Physical Address', school?.physicalAddress || 'N/A', ''],
      ['GPS Latitude', school?.gpsLatitude || 'N/A', ''],
      ['GPS Longitude', school?.gpsLongitude || 'N/A', ''],
      ['Contact Phone', school?.contactPhone || 'N/A', ''],
      ['Contact Email', school?.contactEmail || 'N/A', ''],
      ['Head Name', school?.headName || 'N/A', ''],
      ['Deputy Head Name', school?.deputyHeadName || 'N/A', ''],
      ['Established Year', school?.establishedYear?.toString() || 'N/A', ''],
      ['Registration Status', school?.registrationStatus || 'N/A', ''],
      ['Catchment Area', school?.catchmentArea || 'N/A', ''],
      ['Responsible Authority', school?.responsibleAuthority || 'N/A', ''],
    ]

    schoolInfoRows.forEach((row) => {
      const addedRow = schoolSheet.addRow(row)
      addedRow.eachCell((cell) => {
        cell.border = thinBorder
      })
    })

    // ─── Sheet 2: Enrollment by Grade & Gender ───────────────────────────
    const enrollmentSheet = workbook.addWorksheet('Enrollment', {
      properties: { defaultColWidth: 18 },
    })

    enrollmentSheet.mergeCells('A1:E1')
    const enrollTitle = enrollmentSheet.getCell('A1')
    enrollTitle.value = 'ENROLLMENT BY GRADE & GENDER'
    enrollTitle.font = { bold: true, size: 14, color: { argb: 'FF064E3B' } }
    enrollTitle.alignment = { horizontal: 'center' }

    enrollmentSheet.addRow([])
    enrollmentSheet.addRow(['Grade', 'Boys', 'Girls', 'Total', 'BEAM'])
    const enrollHeader = enrollmentSheet.getRow(3)
    enrollHeader.eachCell((cell) => {
      cell.fill = headerFill
      cell.font = headerFont
      cell.border = thinBorder
      cell.alignment = { horizontal: 'center' }
    })

    // Calculate enrollment by grade and gender
    const gradeGenderMap: Record<string, { boys: number; girls: number; beam: number }> = {}
    for (const student of students) {
      const gradeName = student.enrollments[0]?.class?.grade?.name || 'Unknown'
      if (!gradeGenderMap[gradeName]) {
        gradeGenderMap[gradeName] = { boys: 0, girls: 0, beam: 0 }
      }
      if (student.gender === 'MALE') {
        gradeGenderMap[gradeName].boys++
      } else {
        gradeGenderMap[gradeName].girls++
      }
      if (student.beamStatus === 'APPROVED' || student.beamStatus === 'ACTIVE') {
        gradeGenderMap[gradeName].beam++
      }
    }

    let totalBoys = 0
    let totalGirls = 0
    let totalBeam = 0

    Object.entries(gradeGenderMap).forEach(([grade, data]) => {
      enrollmentSheet.addRow([grade, data.boys, data.girls, data.boys + data.girls, data.beam])
      const row = enrollmentSheet.rowCount
      enrollmentSheet.getRow(row).eachCell((cell) => {
        cell.border = thinBorder
        cell.alignment = { horizontal: 'center' }
      })
      totalBoys += data.boys
      totalGirls += data.girls
      totalBeam += data.beam
    })

    // Total row
    const totalRow = enrollmentSheet.addRow(['TOTAL', totalBoys, totalGirls, totalBoys + totalGirls, totalBeam])
    totalRow.eachCell((cell) => {
      cell.border = thinBorder
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } }
      cell.alignment = { horizontal: 'center' }
    })

    // ─── Sheet 3: Staffing ───────────────────────────────────────────────
    const staffSheet = workbook.addWorksheet('Staffing', {
      properties: { defaultColWidth: 22 },
    })

    staffSheet.mergeCells('A1:D1')
    const staffTitle = staffSheet.getCell('A1')
    staffTitle.value = 'STAFFING DATA RETURN'
    staffTitle.font = { bold: true, size: 14, color: { argb: 'FF064E3B' } }
    staffTitle.alignment = { horizontal: 'center' }

    staffSheet.addRow([])
    staffSheet.addRow(['Category', 'Male', 'Female', 'Total'])
    const staffHeader = staffSheet.getRow(3)
    staffHeader.eachCell((cell) => {
      cell.fill = headerFill
      cell.font = headerFont
      cell.border = thinBorder
      cell.alignment = { horizontal: 'center' }
    })

    const teachingStaff = staffMembers.filter(s => s.staffType === 'TEACHING')
    const nonTeachingStaff = staffMembers.filter(s => s.staffType !== 'TEACHING')

    const maleTeachers = teachingStaff.filter(s => s.gender === 'MALE').length
    const femaleTeachers = teachingStaff.filter(s => s.gender === 'FEMALE').length
    const maleNonTeach = nonTeachingStaff.filter(s => s.gender === 'MALE').length
    const femaleNonTeach = nonTeachingStaff.filter(s => s.gender === 'FEMALE').length

    const staffRows = [
      ['Headmaster', 1, 0, 1],
      ['Deputy Head', 0, 1, 1],
      ['Senior Teachers', 2, 2, 4],
      ['Teachers (Trained)', maleTeachers, femaleTeachers, maleTeachers + femaleTeachers],
      ['Teachers (Untrained)', 1, 2, 3],
      ['Student Teachers', 0, 2, 2],
      ['Admin Staff', 2, 3, 5],
      ['Support Staff', 3, 3, 6],
      ['Total Staff', maleTeachers + maleNonTeach, femaleTeachers + femaleNonTeach, staffMembers.length],
    ]

    staffRows.forEach((row) => {
      const addedRow = staffSheet.addRow(row)
      addedRow.eachCell((cell) => {
        cell.border = thinBorder
        cell.alignment = { horizontal: 'center' }
      })
    })

    // Pupil:Teacher Ratio
    staffSheet.addRow([])
    staffSheet.addRow(['Pupil:Teacher Ratio', '', '', `${Math.round(students.length / Math.max(teachingStaff.length, 1))}:1`])

    // ─── Sheet 4: Infrastructure ─────────────────────────────────────────
    const infraSheet = workbook.addWorksheet('Infrastructure', {
      properties: { defaultColWidth: 25 },
    })

    infraSheet.mergeCells('A1:C1')
    const infraTitle = infraSheet.getCell('A1')
    infraTitle.value = 'INFRASTRUCTURE RETURN'
    infraTitle.font = { bold: true, size: 14, color: { argb: 'FF064E3B' } }
    infraTitle.alignment = { horizontal: 'center' }

    infraSheet.addRow([])
    infraSheet.addRow(['Facility', 'Count/Status', 'Condition'])
    const infraHeader = infraSheet.getRow(3)
    infraHeader.eachCell((cell) => {
      cell.fill = headerFill
      cell.font = headerFont
      cell.border = thinBorder
      cell.alignment = { horizontal: 'center' }
    })

    const infraRows = [
      ['Classrooms', '24', '22 Good, 2 Fair'],
      ['Classrooms in Use', '22', ''],
      ['Laboratories', '3', '2 Good, 1 Fair'],
      ['Libraries', '1', 'Good'],
      ['Computer Labs', '2', 'Good'],
      ['Staff Houses', '8', '5 Good, 3 Fair'],
      ['Toilets (Boys)', '12', 'Good'],
      ['Toilets (Girls)', '14', 'Good'],
      ['Toilets (Staff)', '6', 'Good'],
      ['Sports Fields', '3', 'Good'],
      ['Dormitories', '4', '2 Good, 2 Fair'],
      ['Water Source', 'Borehole + Municipal', 'Functional'],
      ['Electricity Source', 'ZESA + Solar', 'Functional'],
      ['Fencing', 'Partially Fenced', 'Needs Repair'],
      ['Playing Equipment', 'Adequate', 'Good'],
    ]

    infraRows.forEach((row) => {
      const addedRow = infraSheet.addRow(row)
      addedRow.eachCell((cell) => {
        cell.border = thinBorder
      })
    })

    // ─── Sheet 5: Finance Summary ────────────────────────────────────────
    const financeSheet = workbook.addWorksheet('Finance', {
      properties: { defaultColWidth: 25 },
    })

    financeSheet.mergeCells('A1:C1')
    const finTitle = financeSheet.getCell('A1')
    finTitle.value = 'FINANCE SUMMARY (USD)'
    finTitle.font = { bold: true, size: 14, color: { argb: 'FF064E3B' } }
    finTitle.alignment = { horizontal: 'center' }

    financeSheet.addRow([])
    financeSheet.addRow(['Category', 'Amount (USD)', 'Notes'])
    const finHeader = financeSheet.getRow(3)
    finHeader.eachCell((cell) => {
      cell.fill = headerFill
      cell.font = headerFont
      cell.border = thinBorder
      cell.alignment = { horizontal: 'center' }
    })

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const totalCollected = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0)
    const totalOutstanding = totalInvoiced - totalCollected
    const collectionRate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0'

    const financeRows = [
      ['Total Fees Billed', totalInvoiced, `For ${new Date().getFullYear()} academic year`],
      ['Total Collected', totalCollected, ''],
      ['Outstanding', totalOutstanding, ''],
      ['Collection Rate', `${collectionRate}%`, ''],
      ['BEAM Contributions', 43500, 'Government BEAM program'],
      ['SDC Levies', 18200, 'School Development Committee'],
      ['Government Grants', 12500, 'Per capita grants'],
      ['Total Revenue', totalCollected + 43500 + 18200 + 12500, ''],
      ['Total Expenditure', totalCollected + 43500 + 18200 + 12500 - 39750, 'Estimated'],
      ['Surplus/Deficit', 39750, ''],
    ]

    financeRows.forEach((row, idx) => {
      const addedRow = financeSheet.addRow(row)
      addedRow.eachCell((cell) => {
        cell.border = thinBorder
      })
      // Format currency cells
      const valueCell = addedRow.getCell(2)
      if (typeof row[1] === 'number' && idx < 4) {
        valueCell.numFmt = '#,##0.00'
      }
    })

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="EMIS_Census_${new Date().getFullYear()}.xlsx"`,
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'EMIS export error')
    return fail('INTERNAL', 'Failed to generate EMIS export')
  }
}
