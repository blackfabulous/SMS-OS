import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { dispatchNotification } from '@/lib/notifications'

/**
 * PUBLIC admission application endpoint (no auth) for the website apply form.
 * Creates a Student in PENDING status plus a guardian Parent + link, so the
 * application surfaces in the dashboard Admissions module for staff review.
 * Spam-guarded with a honeypot field and basic validation.
 */
const ApplySchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  middleName: z.string().max(80).optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE']),
  dateOfBirth: z.string().min(1),
  gradeApplyingFor: z.string().min(1).max(60),
  boardingStatus: z.enum(['DAY_SCHOLAR', 'BOARDER']).optional(),
  previousSchool: z.string().max(160).optional().or(z.literal('')),
  guardianFirstName: z.string().min(1).max(80),
  guardianLastName: z.string().min(1).max(80),
  guardianPhone: z.string().min(6).max(30),
  guardianEmail: z.string().email().optional().or(z.literal('')),
  guardianRelationship: z.string().max(40).optional().or(z.literal('')),
  message: z.string().max(1000).optional().or(z.literal('')),
  // Honeypot — accept any value at the schema level so a filled value doesn't
  // produce a validation error that signals the trap; handled after parsing.
  company: z.string().optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = ApplySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the form and try again.', details: parsed.error.issues }, { status: 400 })
  }
  const d = parsed.data

  // Honeypot triggered → pretend success, persist nothing.
  if (d.company) {
    return NextResponse.json({ message: 'Application received', reference: 'APP-OK' }, { status: 201 })
  }

  const school = await db.school.findFirst()
  if (!school) {
    return NextResponse.json({ error: 'Admissions are not currently configured. Please contact the school directly.' }, { status: 503 })
  }

  try {
    const currentYear = new Date().getFullYear()
    const last = await db.student.findFirst({
      where: { studentNumber: { startsWith: `APP${currentYear}` } },
      orderBy: { studentNumber: 'desc' },
    })
    const nextNum = last ? parseInt(last.studentNumber.slice(-4)) + 1 : 1
    const studentNumber = `APP${currentYear}${String(nextNum).padStart(4, '0')}`

    const student = await db.student.create({
      data: {
        schoolId: school.id,
        studentNumber,
        firstName: d.firstName,
        lastName: d.lastName,
        middleName: d.middleName || null,
        gender: d.gender,
        dateOfBirth: new Date(d.dateOfBirth),
        enrollmentStatus: 'PENDING',
        boardingStatus: d.boardingStatus || null,
        previousSchool: d.previousSchool || null,
        admissionDate: new Date(),
      },
    })

    const parent = await db.parent.create({
      data: {
        schoolId: school.id,
        firstName: d.guardianFirstName,
        lastName: d.guardianLastName,
        phone: d.guardianPhone,
        email: d.guardianEmail || null,
        preferredContact: d.guardianEmail ? 'EMAIL' : 'SMS',
        isFeeResponsible: true,
      },
    })
    await db.studentParent.create({
      data: {
        schoolId: school.id,
        studentId: student.id,
        parentId: parent.id,
        relationship: d.guardianRelationship || 'Guardian',
        isPrimary: true,
        isFeeResponsible: true,
      },
    })

    // Acknowledge the application to the guardian over enabled channels.
    // Fire-and-forget (matches the logAudit pattern) so it never blocks the response.
    void dispatchNotification(
      school.id,
      { type: 'admission.received', applicantName: `${d.firstName} ${d.lastName}`, reference: studentNumber },
      { parentId: parent.id, phone: d.guardianPhone, email: d.guardianEmail || null, name: `${d.guardianFirstName} ${d.guardianLastName}` },
    ).catch(() => {})

    return NextResponse.json(
      {
        message: 'Application received',
        reference: studentNumber,
        appliedFor: d.gradeApplyingFor,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Public admission application failed:', error)
    return NextResponse.json({ error: 'Something went wrong submitting your application. Please try again later.' }, { status: 500 })
  }
}
