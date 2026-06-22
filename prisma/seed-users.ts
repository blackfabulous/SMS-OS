import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import type { Role } from '@prisma/client'

async function seedUsers() {
  console.log('🌱 Seeding users...')

  // Get the first school for default users
  const school = await db.school.findFirst()
  if (!school) {
    console.error('❌ No school found. Please seed school data first.')
    process.exit(1)
  }

  // Get a staff member for the teacher user
  const staffMember = await db.staff.findFirst()
  // Get a student for the student user
  const studentMember = await db.student.findFirst()

  const users = [
    {
      email: 'admin@zimschool.co.zw',
      password: 'password123',
      name: 'Admin User',
      role: 'ADMIN',
      schoolId: school.id,
      staffId: null,
      studentId: null,
    },
    {
      email: 'teacher@zimschool.co.zw',
      password: 'password123',
      name: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Teacher User',
      role: 'TEACHER',
      schoolId: school.id,
      staffId: staffMember?.id ?? null,
      studentId: null,
    },
    {
      email: 'parent@zimschool.co.zw',
      password: 'password123',
      name: 'Parent User',
      role: 'PARENT',
      schoolId: school.id,
      staffId: null,
      studentId: null,
    },
    {
      email: 'student@zimschool.co.zw',
      password: 'password123',
      name: studentMember ? `${studentMember.firstName} ${studentMember.lastName}` : 'Student User',
      role: 'STUDENT',
      schoolId: school.id,
      staffId: null,
      studentId: studentMember?.id ?? null,
    },
    {
      email: 'bursar@zimschool.co.zw',
      password: 'password123',
      name: 'Bursar User',
      role: 'BURSAR',
      schoolId: school.id,
      staffId: null,
      studentId: null,
    },
  ]

  for (const userData of users) {
    const existing = await db.user.findUnique({
      where: { email: userData.email },
    })

    if (existing) {
      console.log(`⏭️  User ${userData.email} already exists, skipping...`)
      continue
    }

    const hashedPassword = await hashPassword(userData.password)

    await db.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role as Role,
        schoolId: userData.schoolId,
        staffId: userData.staffId,
        studentId: userData.studentId,
        isActive: true,
      },
    })

    console.log(`✅ Created user: ${userData.email} (${userData.role})`)
  }

  console.log('🎉 User seeding complete!')
  console.log('')
  console.log('📋 Default credentials:')
  console.log('   Admin:   admin@zimschool.co.zw / password123')
  console.log('   Teacher: teacher@zimschool.co.zw / password123')
  console.log('   Parent:  parent@zimschool.co.zw / password123')
  console.log('   Student: student@zimschool.co.zw / password123')
  console.log('   Bursar:  bursar@zimschool.co.zw / password123')
}

seedUsers()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
