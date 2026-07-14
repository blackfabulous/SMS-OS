import { PrismaClient, Prisma, Role, PersonType, Currency, Gender, StaffType, EnrollmentStatus, InvoiceStatus, PaymentMethod, FeeFrequency } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding dev school...");

  const school = await prisma.school.create({
    data: {
      name: "Dev School",
      slug: "dev-school",
      address: "123 Harare Road",
      country: "Zimbabwe",
      phone: "+263 123 456 789",
      email: "admin@devschool.zw",
      timezone: "Africa/Harare",
      defaultCurrency: Currency.ZWG,
      settings: {
        create: [
          { key: "school.timezone", value: "Africa/Harare" },
          { key: "school.contact_email", value: "admin@devschool.zw" },
          { key: "finance.default_currency", value: "ZWG" },
          { key: "communications.default_channel", value: "EMAIL" },
        ],
      },
    },
  });

  const academicYear = await prisma.academicYear.create({
    data: {
      schoolId: school.id,
      name: "2025 Academic Year",
      startDate: new Date("2025-01-13"),
      endDate: new Date("2025-12-05"),
      isCurrent: true,
    },
  });

  const term = await prisma.term.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: "Term 1",
      startDate: new Date("2025-01-13"),
      endDate: new Date("2025-04-04"),
      isCurrent: true,
    },
  });

  const grade1 = await prisma.grade.create({
    data: {
      schoolId: school.id,
      name: "Grade 1",
      level: 1,
    },
  });

  const subjectMath = await prisma.subject.create({
    data: {
      schoolId: school.id,
      name: "Mathematics",
      code: "MATH",
    },
  });

  const class1A = await prisma.class.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      gradeId: grade1.id,
      name: "1A",
      section: "A",
    },
  });

  await prisma.gradeSubject.create({
    data: {
      schoolId: school.id,
      gradeId: grade1.id,
      subjectId: subjectMath.id,
      isCore: true,
      hoursPerWeek: 5,
    },
  });

  // Teacher (staff)
  const teacher = await prisma.staff.create({
    data: {
      schoolId: school.id,
      staffNumber: "T001",
      firstName: "Tendai",
      lastName: "Moyo",
      email: "teacher@devschool.zw",
      phone: "+263 777 111 111",
      gender: Gender.MALE,
      staffType: StaffType.TEACHING,
      isTeacher: true,
    },
  });

  await prisma.user.create({
    data: {
      schoolId: school.id,
      email: "teacher@devschool.zw",
      role: Role.TEACHER,
      personType: PersonType.STAFF,
      personId: teacher.id,
      passwordHash: "hashed-password-placeholder",
    },
  });

  // Guardian
  const guardian = await prisma.guardian.create({
    data: {
      schoolId: school.id,
      firstName: "Grace",
      lastName: "Moyo",
      email: "parent@devschool.zw",
      phone: "+263 777 000 000",
      relationship: "Mother",
    },
  });

  await prisma.user.create({
    data: {
      schoolId: school.id,
      email: "parent@devschool.zw",
      role: Role.PARENT,
      personType: PersonType.GUARDIAN,
      personId: guardian.id,
      passwordHash: "hashed-password-placeholder",
    },
  });

  // Student
  const student = await prisma.student.create({
    data: {
      schoolId: school.id,
      studentNumber: "S001",
      firstName: "Nkosana",
      lastName: "Moyo",
      gender: Gender.MALE,
      dateOfBirth: new Date("2015-05-15"),
      enrollmentStatus: EnrollmentStatus.ENROLLED,
    },
  });

  await prisma.user.create({
    data: {
      schoolId: school.id,
      email: "student@devschool.zw",
      role: Role.STUDENT,
      personType: PersonType.STUDENT,
      personId: student.id,
      passwordHash: "hashed-password-placeholder",
    },
  });

  await prisma.studentGuardian.create({
    data: {
      schoolId: school.id,
      studentId: student.id,
      guardianId: guardian.id,
      isPrimary: true,
      canPickup: true,
    },
  });

  await prisma.enrollment.create({
    data: {
      schoolId: school.id,
      studentId: student.id,
      academicYearId: academicYear.id,
      gradeId: grade1.id,
      classId: class1A.id,
      rollNumber: "1",
      status: EnrollmentStatus.ENROLLED,
    },
  });

  // Finance: fee structure, invoice, payment
  const feeStructure = await prisma.feeStructure.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      gradeId: grade1.id,
      name: "Grade 1 Tuition",
      description: "Term 1 tuition fee",
      currency: Currency.ZWG,
      amount: new Prisma.Decimal("500.00"),
      dueDate: new Date("2025-02-01"),
      frequency: FeeFrequency.TERM,
      isMandatory: true,
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      schoolId: school.id,
      studentId: student.id,
      academicYearId: academicYear.id,
      termId: term.id,
      invoiceNumber: "INV-2025-001",
      issueDate: new Date("2025-01-15"),
      dueDate: new Date("2025-02-01"),
      status: InvoiceStatus.SENT,
      currency: Currency.ZWG,
      totalAmount: new Prisma.Decimal("500.00"),
      notes: "Grade 1 Term 1 tuition",
    },
  });

  await prisma.invoiceItem.create({
    data: {
      schoolId: school.id,
      invoiceId: invoice.id,
      feeStructureId: feeStructure.id,
      description: "Grade 1 Tuition",
      quantity: new Prisma.Decimal("1.00"),
      unitAmount: new Prisma.Decimal("500.00"),
      totalAmount: new Prisma.Decimal("500.00"),
    },
  });

  const payment = await prisma.payment.create({
    data: {
      schoolId: school.id,
      studentId: student.id,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      currency: Currency.ZWG,
      amount: new Prisma.Decimal("250.00"),
      reference: "PAY-001",
      paidAt: new Date(),
    },
  });

  await prisma.paymentAllocation.create({
    data: {
      schoolId: school.id,
      paymentId: payment.id,
      invoiceId: invoice.id,
      amount: new Prisma.Decimal("250.00"),
      currency: Currency.ZWG,
    },
  });

  console.log(`Seeded school: ${school.name} (${school.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
