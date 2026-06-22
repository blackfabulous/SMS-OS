import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import type { EnrollmentStatus, BoardingStatus } from '@prisma/client'

/**
 * Seeds the database with a full demo dataset for one school.
 * Headless-runnable (used by `prisma/seed.ts`) and by the gated `/api/seed` route.
 * Postgres-safe: deletions run child→parent in dependency order (no FK-disable needed).
 * Throws on error — callers decide how to surface it.
 */
export async function seedDatabase() {
  // Clear existing data (ordered children → parents so FK constraints hold)
  const deleteOps = [
    'maintenanceRequest', 'libraryTransaction', 'libraryBook', 'assessmentMark',
    'assessment', 'reportCard', 'invoiceItem', 'feePayment', 'feeInvoice',
    'feeStructure', 'bankAccount', 'scholarship', 'beamApplication',
    'welfareRecord', 'disciplineRecord', 'healthRecord', 'boardingAssignment',
    'dormitory', 'hostel', 'transportAssignment', 'vehicle', 'transportRoute',
    'communication', 'sDCMember', 'staffDiscipline', 'appraisalRecord',
    'leaveRecord', 'payslip', 'studentParent', 'studentEnrollment',
    'attendance', 'gradeSubject', 'class', 'grade', 'subject', 'term',
    'academicYear', 'department', 'asset', 'supplier', 'house',
    'schoolEvent', 'club', 'sportsCode', 'zimsecCandidate', 'student',
    'parent', 'staff', 'user', 'auditLog', 'school',
  ] as const

  for (const model of deleteOps) {
    try {
      await ((db as unknown) as Record<string, { deleteMany: () => Promise<unknown> }>)[model].deleteMany()
    } catch {
      // Skip if model doesn't exist or already empty
    }
  }

  // ========= CREATE SCHOOL =========
  const school = await db.school.create({
    data: {
      name: 'Mufakose High School',
      code: 'MFHS001',
      motto: 'Knowledge is Power',
      zimsecCentreNumber: 'CN12345',
      mopseDistrict: 'Harare',
      province: 'Harare',
      schoolType: 'GOVERNMENT',
      ownershipType: 'GOVERNMENT',
      levelType: 'SECONDARY',
      registrationStatus: 'REGISTERED',
      headName: 'Mr. T. Moyo',
      deputyHeadName: 'Mrs. S. Dube',
      contactEmail: 'info@mufakosehigh.ac.zw',
      contactPhone: '+263-4-7561234',
      physicalAddress: '45 Mufakose Drive, Mufakose, Harare',
      catchmentArea: 'Mufakose, Budiriro, Kambuzuma',
      responsibleAuthority: 'Ministry of Primary and Secondary Education',
      establishedYear: 1985,
      bankName: 'CBZ Bank',
      bankAccountNumber: '0123456789012',
      bankBranch: 'Mufakose Branch',
      sdcChairperson: 'Mr. J. Chikwata',
      sdcSecretary: 'Mrs. R. Gumbo',
      sdcTreasurer: 'Mr. P. Ncube',
    },
  })

  // ========= ACADEMIC YEAR & TERMS =========
  const academicYear = await db.academicYear.create({
    data: {
      schoolId: school.id,
      name: '2025',
      startDate: new Date('2025-01-13'),
      endDate: new Date('2025-12-05'),
      isCurrent: true,
      isActive: true,
    },
  })

  await db.term.create({
    data: {
      academicYearId: academicYear.id,
      name: 'First Term',
      termNumber: 1,
      startDate: new Date('2025-01-13'),
      endDate: new Date('2025-04-04'),
      openingDate: new Date('2025-01-13'),
      closingDate: new Date('2025-04-04'),
      isCurrent: false,
    },
  })

  await db.term.create({
    data: {
      academicYearId: academicYear.id,
      name: 'Second Term',
      termNumber: 2,
      startDate: new Date('2025-05-05'),
      endDate: new Date('2025-08-08'),
      openingDate: new Date('2025-05-05'),
      closingDate: new Date('2025-08-08'),
      isCurrent: false,
    },
  })

  const term3 = await db.term.create({
    data: {
      academicYearId: academicYear.id,
      name: 'Third Term',
      termNumber: 3,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-05'),
      openingDate: new Date('2025-09-01'),
      closingDate: new Date('2025-12-05'),
      isCurrent: true,
    },
  })

  // ========= GRADES =========
  const gradeNames = [
    'ECD A', 'ECD B',
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7',
    'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6',
  ]

  const grades: any[] = []
  for (let i = 0; i < gradeNames.length; i++) {
    const level = i < 2 ? 'ECD' : i < 9 ? 'PRIMARY' : 'SECONDARY'
    const grade = await db.grade.create({
      data: {
        schoolId: school.id,
        name: gradeNames[i],
        level,
        sequence: i + 1,
        isActive: true,
      },
    })
    grades.push(grade)
  }

  // ========= CLASSES WITH STREAMS =========
  const classes: any[] = []
  const streams = ['A', 'B']
  for (const grade of grades) {
    const streamCount = grade.name.startsWith('ECD') ? 1 : 2
    for (let s = 0; s < streamCount; s++) {
      const cls = await db.class.create({
        data: {
          schoolId: school.id,
          gradeId: grade.id,
          name: `${grade.name} ${streams[s]}`,
          stream: streams[s],
          academicYear: '2025',
          capacity: 40,
          isActive: true,
        },
      })
      classes.push(cls)
    }
  }

  // ========= DEPARTMENTS =========
  const departmentNames = ['Sciences', 'Languages', 'Humanities', 'Commercial', 'Technical', 'Mathematics']
  const departments: any[] = []
  for (const deptName of departmentNames) {
    const dept = await db.department.create({
      data: {
        schoolId: school.id,
        name: deptName,
      },
    })
    departments.push(dept)
  }

  // ========= SUBJECTS =========
  const subjectData = [
    { code: 'MATH', name: 'Mathematics', department: 'Mathematics', isCore: true },
    { code: 'ENG', name: 'English Language', department: 'Languages', isCore: true },
    { code: 'SHO', name: 'Shona', department: 'Languages', isCore: true },
    { code: 'SCI', name: 'General Science', department: 'Sciences', isCore: true },
    { code: 'PHY', name: 'Physics', department: 'Sciences', isCore: false },
    { code: 'CHEM', name: 'Chemistry', department: 'Sciences', isCore: false },
    { code: 'BIO', name: 'Biology', department: 'Sciences', isCore: false },
    { code: 'HIST', name: 'History', department: 'Humanities', isCore: true },
    { code: 'GEO', name: 'Geography', department: 'Humanities', isCore: true },
    { code: 'ACC', name: 'Accounting', department: 'Commercial', isCore: false },
    { code: 'BSTD', name: 'Business Studies', department: 'Commercial', isCore: false },
    { code: 'ECD', name: 'Economics', department: 'Commercial', isCore: false },
    { code: 'TECH', name: 'Technical Graphics', department: 'Technical', isCore: false, isPractical: true },
    { code: 'ART', name: 'Art', department: 'Technical', isCore: false, isPractical: true },
    { code: 'PE', name: 'Physical Education', department: 'Technical', isCore: false, isPractical: true },
    { code: 'RE', name: 'Religious Education', department: 'Humanities', isCore: false },
    { code: 'COMP', name: 'Computer Studies', department: 'Sciences', isCore: false },
    { code: 'AGRI', name: 'Agriculture', department: 'Sciences', isCore: false, isPractical: true },
  ]

  const subjects: any[] = []
  for (const sub of subjectData) {
    const subject = await db.subject.create({
      data: {
        schoolId: school.id,
        code: sub.code,
        name: sub.name,
        department: sub.department,
        isCore: sub.isCore || false,
        isPractical: sub.isPractical || false,
        passMark: 50,
        isActive: true,
      },
    })
    subjects.push(subject)
  }

  // Assign core subjects to all grades
  const coreSubjects = subjects.filter((s) => {
    const sub = subjectData.find((sd) => sd.code === s.code)
    return sub?.isCore
  })

  for (const grade of grades) {
    for (const subject of coreSubjects) {
      await db.gradeSubject.create({
        data: {
          gradeId: grade.id,
          subjectId: subject.id,
          isCompulsory: true,
          periodsPerWeek: 5,
        },
      })
    }
  }

  // ========= PARENTS =========
  const parentData = [
    { title: 'Mr', firstName: 'John', lastName: 'Chikwata', phone: '+263772123456', occupation: 'Engineer', address: '45 Mufakose Drive, Harare' },
    { title: 'Mrs', firstName: 'Mary', lastName: 'Dube', phone: '+263773234567', occupation: 'Teacher', address: '12 Budiriro Rd, Harare' },
    { title: 'Mr', firstName: 'Peter', lastName: 'Ncube', phone: '+263774345678', occupation: 'Businessman', address: '78 Kambuzuma St, Harare' },
    { title: 'Mrs', firstName: 'Grace', lastName: 'Moyo', phone: '+263775456789', occupation: 'Nurse', address: '23 Mufakose Ave, Harare' },
    { title: 'Mr', firstName: 'David', lastName: 'Mukwedeya', phone: '+263776567890', occupation: 'Driver', address: '56 Budiriro 5, Harare' },
    { title: 'Mrs', firstName: 'Ruth', lastName: 'Gumbo', phone: '+263777678901', occupation: 'Tailor', address: '34 Mufakose 2, Harare' },
    { title: 'Mr', firstName: 'Samuel', lastName: 'Zhou', phone: '+263778789012', occupation: 'Farmer', address: '89 Seke Rd, Harare' },
    { title: 'Mrs', firstName: 'Faith', lastName: 'Chiremba', phone: '+263779890123', occupation: 'Shopkeeper', address: '67 Kambuzuma 3, Harare' },
    { title: 'Mr', firstName: 'James', lastName: 'Mhishi', phone: '+263712345678', occupation: 'Mechanic', address: '12 Mufakose 4, Harare' },
    { title: 'Mrs', firstName: 'Patience', lastName: 'Sibanda', phone: '+263713456789', occupation: 'Secretary', address: '45 Budiriro 2, Harare' },
    { title: 'Mr', firstName: 'Robert', lastName: 'Chikoto', phone: '+263714567890', occupation: 'Builder', address: '23 Glen View, Harare' },
    { title: 'Mrs', firstName: 'Esther', lastName: 'Mlambo', phone: '+263715678901', occupation: 'Social Worker', address: '56 Warren Park, Harare' },
  ]

  const parents: any[] = []
  for (const p of parentData) {
    const parent = await db.parent.create({
      data: {
        schoolId: school.id,
        title: p.title,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        occupation: p.occupation,
        address: p.address,
        preferredContact: 'SMS',
        isFeeResponsible: true,
      },
    })
    parents.push(parent)
  }

  // ========= STAFF =========
  const staffData = [
    { title: 'Mr', firstName: 'Tawanda', lastName: 'Moyo', position: 'Headmaster', staffType: 'TEACHING', department: 'Mathematics', basicSalary: 2500, subjectSpecialisation: 'Mathematics' },
    { title: 'Mrs', firstName: 'Sithabile', lastName: 'Dube', position: 'Deputy Head', staffType: 'TEACHING', department: 'Languages', basicSalary: 2200, subjectSpecialisation: 'English' },
    { title: 'Mr', firstName: 'Kudakwashe', lastName: 'Chingono', position: 'Teacher', staffType: 'TEACHING', department: 'Sciences', basicSalary: 1800, subjectSpecialisation: 'Physics' },
    { title: 'Mrs', firstName: 'Nomsa', lastName: 'Ndlovu', position: 'Teacher', staffType: 'TEACHING', department: 'Languages', basicSalary: 1800, subjectSpecialisation: 'Shona' },
    { title: 'Mr', firstName: 'Blessing', lastName: 'Mhlanga', position: 'Teacher', staffType: 'TEACHING', department: 'Sciences', basicSalary: 1800, subjectSpecialisation: 'Biology' },
    { title: 'Mrs', firstName: 'Mildred', lastName: 'Chidakwa', position: 'Teacher', staffType: 'TEACHING', department: 'Humanities', basicSalary: 1800, subjectSpecialisation: 'History' },
    { title: 'Mr', firstName: 'Farai', lastName: 'Gumbo', position: 'Teacher', staffType: 'TEACHING', department: 'Commercial', basicSalary: 1800, subjectSpecialisation: 'Accounting' },
    { title: 'Mrs', firstName: 'Chiedza', lastName: 'Marufu', position: 'Teacher', staffType: 'TEACHING', department: 'Mathematics', basicSalary: 1800, subjectSpecialisation: 'Mathematics' },
    { title: 'Mr', firstName: 'Tendai', lastName: 'Zvinavashe', position: 'Teacher', staffType: 'TEACHING', department: 'Sciences', basicSalary: 1800, subjectSpecialisation: 'Chemistry' },
    { title: 'Mrs', firstName: 'Rumbidzai', lastName: 'Machirori', position: 'Teacher', staffType: 'TEACHING', department: 'Languages', basicSalary: 1800, subjectSpecialisation: 'English' },
    { title: 'Mr', firstName: 'Panashe', lastName: 'Chigwada', position: 'Teacher', staffType: 'TEACHING', department: 'Technical', basicSalary: 1800, subjectSpecialisation: 'Technical Graphics' },
    { title: 'Mrs', firstName: 'Tasvinya', lastName: 'Mukanganwi', position: 'School Bursar', staffType: 'NON_TEACHING', department: 'Administration', basicSalary: 1500 },
    { title: 'Mr', firstName: 'Elijah', lastName: 'Shumba', position: 'School Clerk', staffType: 'NON_TEACHING', department: 'Administration', basicSalary: 1200 },
    { title: 'Mrs', firstName: 'Agnes', lastName: 'Zenda', position: 'Librarian', staffType: 'NON_TEACHING', department: 'Administration', basicSalary: 1200 },
    { title: 'Mr', firstName: 'Obert', lastName: 'Gwinhi', position: 'Groundsman', staffType: 'SUPPORT', department: 'Support', basicSalary: 800 },
    { title: 'Mrs', firstName: 'Molly', lastName: 'Rakodzi', position: 'Cleaner', staffType: 'SUPPORT', department: 'Support', basicSalary: 700 },
    { title: 'Mr', firstName: 'Canisio', lastName: 'Dziva', position: 'Security Guard', staffType: 'SUPPORT', department: 'Support', basicSalary: 750 },
  ]

  const staffMembers: any[] = []
  for (let i = 0; i < staffData.length; i++) {
    const s = staffData[i]
    const currentYear = 2025
    const staffNumber = `STF${currentYear}${(i + 1).toString().padStart(3, '0')}`
    const staff = await db.staff.create({
      data: {
        staffNumber,
        schoolId: school.id,
        title: s.title,
        firstName: s.firstName,
        lastName: s.lastName,
        position: s.position,
        department: s.department,
        staffType: s.staffType as 'TEACHING' | 'NON_TEACHING' | 'SUPPORT',
        basicSalary: s.basicSalary,
        housingAllowance: s.basicSalary * 0.1,
        transportAllowance: s.basicSalary * 0.05,
        subjectSpecialisation: s.subjectSpecialisation,
        gender: s.title === 'Mr' ? 'MALE' : 'FEMALE',
        phone: `+26377${Math.floor(1000000 + Math.random() * 9000000)}`,
        employmentDate: new Date('2015-01-01'),
        contractType: 'PERMANENT',
        payrollStatus: 'ACTIVE',
        isActive: true,
      },
    })
    staffMembers.push(staff)
  }

  // ========= USERS (Auth) =========
  const hashedPassword = await hashPassword('password123')
  await db.user.createMany({
    data: [
      { email: 'admin@zimschool.co.zw', password: hashedPassword, name: 'Admin User', role: 'ADMIN', schoolId: school.id, staffId: staffMembers[0]?.id, isActive: true },
      { email: 'headmaster@zimschool.co.zw', password: hashedPassword, name: 'Tawanda Moyo', role: 'ADMIN', schoolId: school.id, isActive: true },
      { email: 'teacher@zimschool.co.zw', password: hashedPassword, name: 'Kudakwashe Chingono', role: 'TEACHER', schoolId: school.id, staffId: staffMembers[2]?.id, isActive: true },
      { email: 'bursar@zimschool.co.zw', password: hashedPassword, name: 'Tasvinya Mukanganwi', role: 'BURSAR', schoolId: school.id, staffId: staffMembers[11]?.id, isActive: true },
    ],
  })

  // ========= STUDENTS =========
  const firstNamesMale = ['Tinotenda', 'Kudakwashe', 'Blessing', 'Farai', 'Tendai', 'Panashe', 'Munashe', 'Anesu', 'Nyasha', 'Tatenda', 'Takudzwa', 'Tanaka', 'Micheal', 'Simbarashe', 'Godwin', 'Tawanda', 'Shingirai', 'Rodwell', 'Lloyd', 'Kudzai', 'Dean', 'Shelton', 'Martin', 'Aaron', 'Noah']
  const firstNamesFemale = ['Rumbidzai', 'Chiedza', 'Nomsa', 'Rudo', 'Tasvinya', 'Mildred', 'Chido', 'Tanyaradzwa', 'Nyasha', 'Tendai', 'Tinotenda', 'Kudzai', 'Mufaro', 'Tanyaradzwa', 'Shamiso', 'Nomatter', 'Precious', 'Grace', 'Faith', 'Hope', 'Patience', 'Memory', 'Wadzanai', 'Rutendo', 'Kumbirai']
  const lastNames = ['Moyo', 'Dube', 'Ncube', 'Mhlanga', 'Chingono', 'Ndlovu', 'Gumbo', 'Mukwedeya', 'Chiremba', 'Mhishi', 'Sibanda', 'Chikoto', 'Mlambo', 'Marufu', 'Zvinavashe', 'Chigwada', 'Machirori', 'Mukanganwi', 'Shumba', 'Zenda', 'Gwinhi', 'Rakodzi', 'Dziva', 'Chidakwa', 'Kawanza']

  const students: any[] = []
  const enrollmentStatuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'TRANSFERRED', 'GRADUATED', 'DROPPED_OUT', 'ACTIVE', 'ACTIVE', 'ACTIVE']
  const boardingStatuses = ['BOARDER', 'DAY_SCHOLAR', 'DAY_SCHOLAR', 'DAY_SCHOLAR', 'BOARDER']

  for (let i = 0; i < 55; i++) {
    const isMale = i < 28
    const firstName = isMale
      ? firstNamesMale[i % firstNamesMale.length]
      : firstNamesFemale[(i - 28) % firstNamesFemale.length]
    const lastName = lastNames[i % lastNames.length]
    const status = enrollmentStatuses[i % enrollmentStatuses.length]
    const boarding = boardingStatuses[i % boardingStatuses.length]
    const currentYear = 2025
    const studentNumber = `STU${currentYear}${(i + 1).toString().padStart(3, '0')}`

    // Assign to a grade (skip ECD for some)
    const gradeIndex = 2 + (i % (grades.length - 2)) // Start from Grade 1
    const assignedGrade = grades[gradeIndex]
    const gradeClasses = classes.filter((c) => c.gradeId === assignedGrade.id)
    const assignedClass = gradeClasses[i % gradeClasses.length]

    const student = await db.student.create({
      data: {
        studentNumber,
        schoolId: school.id,
        firstName,
        lastName,
        gender: isMale ? 'MALE' : 'FEMALE',
        dateOfBirth: new Date(2007 + Math.floor(i / 10), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)),
        enrollmentStatus: status as EnrollmentStatus,
        boardingStatus: boarding as BoardingStatus,
        nationality: 'Zimbabwean',
        homeLanguage: i % 3 === 0 ? 'Shona' : 'English',
        bloodGroup: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-'][i % 6],
        admissionDate: new Date(2025, 0, 13),
      },
    })
    students.push({ student, assignedClass, assignedGrade })

    // Create enrollment
    if (status === 'ACTIVE') {
      await db.studentEnrollment.create({
        data: {
          studentId: student.id,
          classId: assignedClass.id,
          academicYearId: academicYear.id,
          status: 'ACTIVE',
        },
      })
    }

    // Create parent link
    const parentIdx = i % parents.length
    const relationship = isMale
      ? (parentIdx % 2 === 0 ? 'Father' : 'Mother')
      : (parentIdx % 2 === 0 ? 'Mother' : 'Father')
    await db.studentParent.create({
      data: {
        studentId: student.id,
        parentId: parents[parentIdx].id,
        relationship,
        isPrimary: true,
        isFeeResponsible: true,
      },
    })
  }

  // ========= FEE STRUCTURES =========
  const feeTypes = [
    { name: 'Tuition Fee', feeType: 'TUITION' },
    { name: 'Levy Fee', feeType: 'LEVY' },
    { name: 'Development Levy', feeType: 'DEVELOPMENT' },
  ]

  const feeAmounts: Record<string, number> = {
    'ECD A': 150, 'ECD B': 150,
    'Grade 1': 200, 'Grade 2': 200, 'Grade 3': 200, 'Grade 4': 200, 'Grade 5': 220, 'Grade 6': 220, 'Grade 7': 250,
    'Form 1': 350, 'Form 2': 350, 'Form 3': 380, 'Form 4': 400, 'Form 5': 450, 'Form 6': 450,
  }

  for (const grade of grades) {
    const baseAmount = feeAmounts[grade.name] || 200
    for (const feeType of feeTypes) {
      const amount = feeType.feeType === 'TUITION' ? baseAmount : feeType.feeType === 'LEVY' ? Math.floor(baseAmount * 0.3) : Math.floor(baseAmount * 0.2)
      await db.feeStructure.create({
        data: {
          schoolId: school.id,
          gradeId: grade.id,
          termId: term3.id,
          name: feeType.name,
          feeType: feeType.feeType,
          amount,
          currency: 'USD',
          isActive: true,
        },
      })
    }
  }

  // ========= INVOICES & PAYMENTS =========
  const activeStudents = students.filter((s) => s.student.enrollmentStatus === 'ACTIVE')
  let invoiceSeq = 1
  let paymentSeq = 1

  for (let i = 0; i < Math.min(activeStudents.length, 40); i++) {
    const { student, assignedGrade } = activeStudents[i]
    const baseAmount = feeAmounts[assignedGrade.name] || 200
    const totalAmount = baseAmount * 1.5 // tuition + levies

    const invoice = await db.feeInvoice.create({
      data: {
        invoiceNumber: `INV2025${invoiceSeq.toString().padStart(3, '0')}`,
        studentId: student.id,
        termId: term3.id,
        totalAmount,
        amountPaid: 0,
        balance: totalAmount,
        dueDate: new Date('2025-10-15'),
        status: 'PENDING',
        items: {
          create: [
            { description: 'Tuition Fee', amount: baseAmount, feeType: 'TUITION' },
            { description: 'Levy Fee', amount: Math.floor(baseAmount * 0.3), feeType: 'LEVY' },
            { description: 'Development Levy', amount: Math.floor(baseAmount * 0.2), feeType: 'DEVELOPMENT' },
          ],
        },
      },
    })
    invoiceSeq++

    // Create partial payments for some students
    if (i % 3 === 0) {
      const paymentAmount = totalAmount * (0.3 + Math.random() * 0.7)
      await db.feePayment.create({
        data: {
          receiptNumber: `RCP2025${paymentSeq.toString().padStart(3, '0')}`,
          studentId: student.id,
          invoiceId: invoice.id,
          parentId: parents[i % parents.length].id,
          amount: paymentAmount,
          paymentMethod: ['CASH', 'ECOCASH', 'BANK_TRANSFER'][i % 3],
          currency: 'USD',
        },
      })
      paymentSeq++

      const newAmountPaid = paymentAmount
      const newBalance = Math.max(0, totalAmount - paymentAmount)
      let newStatus = 'PARTIAL'
      if (newBalance <= 0) newStatus = 'PAID'

      await db.feeInvoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
        },
      })
    }
  }

  // ========= ATTENDANCE RECORDS =========
  // Create attendance for the current week
  const today = new Date()
  const dayOfWeek = today.getDay()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - dayOfWeek + 1) // Monday

  const activeStudentIds = activeStudents.slice(0, 30).map((s) => s.student.id)
  const attendanceStatuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE']

  for (let dayOffset = 0; dayOffset < 5; dayOffset++) { // Mon-Fri
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + dayOffset)

    const attendanceData = activeStudentIds.map((studentId) => ({
      studentId,
      termId: term3.id,
      date,
      attendanceType: 'DAILY',
      status: attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)],
    }))

    await db.attendance.createMany({ data: attendanceData })
  }

  // ========= DISCIPLINE RECORDS =========
  const incidentTypes = ['Late Coming', ' Truancy', 'Bullying', 'Fighting', 'Insolence', 'Dress Code Violation', 'Homework Not Done']
  const actions = ['Verbal Warning', 'Written Warning', 'Detention', 'Parent Called', 'Suspension']

  for (let i = 0; i < 8; i++) {
    const studentIdx = Math.floor(Math.random() * activeStudents.length)
    await db.disciplineRecord.create({
      data: {
        studentId: activeStudents[studentIdx].student.id,
        incidentType: incidentTypes[i % incidentTypes.length],
        description: `Student was involved in ${incidentTypes[i % incidentTypes.length].toLowerCase()} incident`,
        date: new Date(2025, 8 + Math.floor(Math.random() * 3), 1 + Math.floor(Math.random() * 28)),
        action: actions[i % actions.length],
        demeritPoints: Math.floor(Math.random() * 5) + 1,
        parentNotified: i % 2 === 0,
        status: i % 3 === 0 ? 'RESOLVED' : 'OPEN',
      },
    })
  }

  // ========= HEALTH RECORDS =========
  const visitTypes = ['Sick Visit', 'First Aid', 'Follow-up', 'Health Screening']
  const treatments = ['Paracetamol given', 'Wound dressed', 'Referred to clinic', 'Rest advised', 'Eye check done']

  for (let i = 0; i < 10; i++) {
    const studentIdx = Math.floor(Math.random() * activeStudents.length)
    await db.healthRecord.create({
      data: {
        studentId: activeStudents[studentIdx].student.id,
        visitType: visitTypes[i % visitTypes.length],
        description: `Student reported ${['headache', 'stomach pain', 'fever', 'cough', 'injury'][i % 5]}`,
        treatment: treatments[i % treatments.length],
        visitDate: new Date(2025, 8 + Math.floor(Math.random() * 3), 1 + Math.floor(Math.random() * 28)),
      },
    })
  }

  // ========= HOSTELS & DORMITORIES =========
  const hostelBoys = await db.hostel.create({
    data: {
      schoolId: school.id,
      name: 'Mhofu Boys Hostel',
      gender: 'MALE',
      capacity: 100,
      isActive: true,
    },
  })

  const hostelGirls = await db.hostel.create({
    data: {
      schoolId: school.id,
      name: 'Nzou Girls Hostel',
      gender: 'FEMALE',
      capacity: 100,
      isActive: true,
    },
  })

  // Create dormitories
  for (let i = 1; i <= 5; i++) {
    await db.dormitory.create({
      data: {
        hostelId: hostelBoys.id,
        name: `Room ${i}`,
        capacity: 20,
        currentOccupancy: Math.floor(Math.random() * 15),
      },
    })
    await db.dormitory.create({
      data: {
        hostelId: hostelGirls.id,
        name: `Room ${i}`,
        capacity: 20,
        currentOccupancy: Math.floor(Math.random() * 15),
      },
    })
  }

  // ========= TRANSPORT =========
  const route1 = await db.transportRoute.create({
    data: {
      schoolId: school.id,
      name: 'Budiriro Route',
      description: 'Via Budiriro 1-5',
      fee: 50,
      capacity: 50,
      isActive: true,
    },
  })

  const route2 = await db.transportRoute.create({
    data: {
      schoolId: school.id,
      name: 'Kambuzuma Route',
      description: 'Via Kambuzuma 1-4',
      fee: 45,
      capacity: 50,
      isActive: true,
    },
  })

  await db.vehicle.createMany({
    data: [
      { schoolId: school.id, registrationNumber: 'ABC 1234', make: 'Toyota', model: 'Coaster', year: 2018, capacity: 30, driverName: 'Mr. J. Banda', isActive: true },
      { schoolId: school.id, registrationNumber: 'DEF 5678', make: 'Nissan', model: 'Civilian', year: 2019, capacity: 28, driverName: 'Mr. K. Phiri', isActive: true },
    ],
  })

  // Assign some students to transport routes
  const boarderStudents = activeStudents.filter((s) => s.student.boardingStatus === 'DAY_SCHOLAR')
  for (let i = 0; i < Math.min(boarderStudents.length, 10); i++) {
    await db.transportAssignment.create({
      data: {
        studentId: boarderStudents[i].student.id,
        routeId: i % 2 === 0 ? route1.id : route2.id,
        pickupPoint: 'Main Road',
        dropoffPoint: 'School Gate',
        status: 'ACTIVE',
      },
    })
  }

  // ========= LIBRARY BOOKS =========
  const bookData = [
    { title: 'Mathematics for O Level', author: 'M. Mutambara', isbn: '978-0-123456-01', category: 'Mathematics', totalCopies: 10 },
    { title: 'English Language for ZIMSEC', author: 'T. Chigwada', isbn: '978-0-123456-02', category: 'English', totalCopies: 12 },
    { title: 'Shona for Secondary Schools', author: 'N. Ndlovu', isbn: '978-0-123456-03', category: 'Shona', totalCopies: 8 },
    { title: 'General Science Form 3-4', author: 'B. Mhlanga', isbn: '978-0-123456-04', category: 'Science', totalCopies: 10 },
    { title: 'History of Zimbabwe', author: 'A. Mlambo', isbn: '978-0-123456-05', category: 'History', totalCopies: 6 },
    { title: 'Geography for Africa', author: 'S. Moyo', isbn: '978-0-123456-06', category: 'Geography', totalCopies: 8 },
    { title: 'Accounting Principles', author: 'R. Gumbo', isbn: '978-0-123456-07', category: 'Accounting', totalCopies: 5 },
    { title: 'Biology for Advanced Level', author: 'K. Chingono', isbn: '978-0-123456-08', category: 'Biology', totalCopies: 7 },
    { title: 'Chemistry Matters', author: 'F. Marufu', isbn: '978-0-123456-09', category: 'Chemistry', totalCopies: 6 },
    { title: 'Physics for O Level', author: 'P. Zvinavashe', isbn: '978-0-123456-10', category: 'Physics', totalCopies: 5 },
    { title: 'Business Studies Today', author: 'M. Machirori', isbn: '978-0-123456-11', category: 'Business', totalCopies: 8 },
    { title: 'Agriculture for Zimbabwe', author: 'C. Dziva', isbn: '978-0-123456-12', category: 'Agriculture', totalCopies: 4 },
  ]

  for (const book of bookData) {
    await db.libraryBook.create({
      data: {
        schoolId: school.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        category: book.category,
        shelfLocation: `SHELF-${book.category.substring(0, 3).toUpperCase()}`,
        totalCopies: book.totalCopies,
        availableCopies: book.totalCopies - Math.floor(Math.random() * 3),
        isActive: true,
      },
    })
  }

  // ========= ASSETS =========
  const assetData = [
    { name: 'Desktop Computer - Lab 1', category: 'IT Equipment', location: 'Computer Lab', cost: 800 },
    { name: 'Projector - Hall', category: 'IT Equipment', location: 'School Hall', cost: 1200 },
    { name: 'Photocopier', category: 'Office Equipment', location: 'Admin Office', cost: 3000 },
    { name: 'Football Posts', category: 'Sports Equipment', location: 'Sports Field', cost: 500 },
    { name: 'Science Lab Equipment Set', category: 'Lab Equipment', location: 'Science Lab', cost: 5000 },
    { name: 'Library Shelves', category: 'Furniture', location: 'Library', cost: 1500 },
    { name: 'Water Tank 5000L', category: 'Infrastructure', location: 'Main Block', cost: 2000 },
    { name: 'Solar Panel System', category: 'Infrastructure', location: 'Roof', cost: 8000 },
    { name: 'School Bus', category: 'Vehicle', location: 'Garage', cost: 35000 },
    { name: 'Piano', category: 'Music Equipment', location: 'Music Room', cost: 2500 },
  ]

  for (let i = 0; i < assetData.length; i++) {
    await db.asset.create({
      data: {
        schoolId: school.id,
        assetTag: `AST${(i + 1).toString().padStart(4, '0')}`,
        name: assetData[i].name,
        category: assetData[i].category,
        location: assetData[i].location,
        purchaseCost: assetData[i].cost,
        purchaseDate: new Date(2020 + Math.floor(i / 3), Math.floor(Math.random() * 12), 1),
        condition: ['GOOD', 'GOOD', 'FAIR', 'GOOD', 'EXCELLENT'][i % 5],
      },
    })
  }

  // ========= HOUSES =========
  const houseColors = [
    { name: 'Shumba', colour: '#DC2626' }, // Red
    { name: 'Sable', colour: '#2563EB' }, // Blue
    { name: 'Nyati', colour: '#16A34A' }, // Green
    { name: 'Nzou', colour: '#CA8A04' }, // Gold
  ]

  for (const house of houseColors) {
    await db.house.create({
      data: {
        schoolId: school.id,
        name: house.name,
        colour: house.colour,
      },
    })
  }

  // ========= EVENTS =========
  await db.schoolEvent.createMany({
    data: [
      { schoolId: school.id, title: 'Term 3 Opening', description: 'School opens for Term 3', eventType: 'ACADEMIC', startDate: new Date('2025-09-01'), venue: 'School Hall' },
      { schoolId: school.id, title: 'Sports Day', description: 'Annual inter-house sports competition', eventType: 'SPORTS', startDate: new Date('2025-10-15'), endDate: new Date('2025-10-16'), venue: 'Sports Field' },
      { schoolId: school.id, title: 'Speech & Prize Giving Day', description: 'Annual speech and prize giving ceremony', eventType: 'CEREMONY', startDate: new Date('2025-11-20'), venue: 'School Hall' },
      { schoolId: school.id, title: 'ZIMSEC Exams Begin', description: 'O Level and A Level examinations begin', eventType: 'ACADEMIC', startDate: new Date('2025-10-20'), endDate: new Date('2025-11-30'), venue: 'Exam Hall' },
      { schoolId: school.id, title: 'Career Day', description: 'Career guidance and counselling day', eventType: 'OTHER', startDate: new Date('2025-09-25'), venue: 'School Hall' },
    ],
  })

  // ========= CLUBS =========
  await db.club.createMany({
    data: [
      { schoolId: school.id, name: 'Debate Club', description: 'Public speaking and debate', meetingDay: 'Wednesday', isActive: true },
      { schoolId: school.id, name: 'Science Club', description: 'Science experiments and projects', meetingDay: 'Thursday', isActive: true },
      { schoolId: school.id, name: 'Drama Club', description: 'Drama and theatre arts', meetingDay: 'Friday', isActive: true },
      { schoolId: school.id, name: 'Chess Club', description: 'Chess and board games', meetingDay: 'Tuesday', isActive: true },
      { schoolId: school.id, name: 'Scripture Union', description: 'Christian fellowship', meetingDay: 'Monday', isActive: true },
    ],
  })

  // ========= SPORTS CODES =========
  await db.sportsCode.createMany({
    data: [
      { schoolId: school.id, name: 'Soccer', season: 'Term 2', isActive: true },
      { schoolId: school.id, name: 'Netball', season: 'Term 2', isActive: true },
      { schoolId: school.id, name: 'Athletics', season: 'Term 1', isActive: true },
      { schoolId: school.id, name: 'Cricket', season: 'Term 1', isActive: true },
      { schoolId: school.id, name: 'Volleyball', season: 'Term 3', isActive: true },
      { schoolId: school.id, name: 'Basketball', season: 'Term 3', isActive: true },
    ],
  })

  // ========= SDC MEMBERS =========
  await db.sDCMember.createMany({
    data: [
      { schoolId: school.id, name: 'Mr. J. Chikwata', position: 'Chairperson', phone: '+263772111111', email: 'chikwata@email.com', termStart: new Date('2024-01-01'), termEnd: new Date('2025-12-31'), isActive: true },
      { schoolId: school.id, name: 'Mrs. R. Gumbo', position: 'Secretary', phone: '+263773222222', email: 'gumbo@email.com', termStart: new Date('2024-01-01'), termEnd: new Date('2025-12-31'), isActive: true },
      { schoolId: school.id, name: 'Mr. P. Ncube', position: 'Treasurer', phone: '+263774333333', email: 'ncube@email.com', termStart: new Date('2024-01-01'), termEnd: new Date('2025-12-31'), isActive: true },
      { schoolId: school.id, name: 'Mrs. M. Zhou', position: 'Committee Member', phone: '+263775444444', termStart: new Date('2024-01-01'), termEnd: new Date('2025-12-31'), isActive: true },
      { schoolId: school.id, name: 'Mr. S. Mhishi', position: 'Committee Member', phone: '+263776555555', termStart: new Date('2024-01-01'), termEnd: new Date('2025-12-31'), isActive: true },
    ],
  })

  // ========= BEAM APPLICATIONS =========
  for (let i = 0; i < 5; i++) {
    const studentIdx = i * 5
    if (studentIdx < activeStudents.length) {
      await db.beamApplication.create({
        data: {
          studentId: activeStudents[studentIdx].student.id,
          applicationDate: new Date('2025-01-15'),
          status: i < 3 ? 'APPROVED' : 'PENDING',
          coveredAmount: i < 3 ? 300 : 0,
          orphanStatus: i % 2 === 0 ? 'DOUBLE_ORPHAN' : 'SINGLE_ORPHAN',
          guardianSituation: 'Unemployed guardian',
          notes: 'Needs financial assistance',
        },
      })
    }
  }

  // ========= PAYSLIPS (for teaching staff) =========
  for (let i = 0; i < Math.min(staffMembers.length, 11); i++) {
    const s = staffMembers[i]
    const basicSalary = s.basicSalary
    const housingAllowance = s.housingAllowance
    const transportAllowance = s.transportAllowance
    const grossPay = basicSalary + housingAllowance + transportAllowance
    const paye = grossPay > 1500 ? (grossPay - 1500) * 0.2 : 0
    const nssaEmployee = Math.min(grossPay * 0.04, 40)
    const aidsLevy = paye * 0.06
    const netPay = grossPay - paye - nssaEmployee - aidsLevy

    await db.payslip.create({
      data: {
        staffId: s.id,
        periodMonth: 2,
        periodYear: 2025,
        basicSalary,
        housingAllowance,
        transportAllowance,
        grossPay,
        paye,
        nssaEmployee,
        nssaEmployer: Math.min(grossPay * 0.04, 40),
        aidsLevy,
        zimdef: 0,
        netPay,
        status: 'PAID',
      },
    })
  }

  // ========= LEAVE RECORDS =========
  const leaveTypes = ['ANNUAL', 'SICK', 'PERSONAL', 'MATERNITY']
  for (let i = 0; i < 5; i++) {
    await db.leaveRecord.create({
      data: {
        staffId: staffMembers[i].id,
        leaveType: leaveTypes[i % leaveTypes.length],
        startDate: new Date(2025, 1 + i, 1),
        endDate: new Date(2025, 1 + i, 3 + i),
        days: 3 + i,
        reason: i % 2 === 0 ? 'Personal matter' : 'Medical appointment',
        status: i < 3 ? 'APPROVED' : 'PENDING',
      },
    })
  }

  // ========= SUPPLIERS =========
  await db.supplier.createMany({
    data: [
      { schoolId: school.id, name: 'Zimbabwe Stationery Supplies', contactPerson: 'Mr. T. Banda', phone: '+2634-666123', email: 'zss@email.com', address: '14 Jason Moyo Ave, Harare', isActive: true },
      { schoolId: school.id, name: 'Chem-Lab Supplies', contactPerson: 'Mrs. N. Zhou', phone: '+2634-667234', email: 'chemlab@email.com', address: '23 Kwame Nkrumah, Harare', isActive: true },
      { schoolId: school.id, name: 'Sports World Zimbabwe', contactPerson: 'Mr. K. Shumba', phone: '+2634-668345', email: 'sports@email.com', address: '45 Samora Machel, Harare', isActive: true },
    ],
  })

  // ========= BANK ACCOUNTS =========
  await db.bankAccount.create({
    data: {
      schoolId: school.id,
      bankName: 'CBZ Bank',
      accountName: 'Mufakose High School Main Account',
      accountNumber: '0123456789012',
      branch: 'Mufakose Branch',
      branchCode: 'CBZ001',
      accountType: 'CURRENT',
      currency: 'USD',
      balance: 45000,
      isActive: true,
    },
  })

  return {
    school: school.name,
    stats: {
      grades: grades.length,
      classes: classes.length,
      subjects: subjects.length,
      students: students.length,
      parents: parents.length,
      staff: staffMembers.length,
    },
  }
}
