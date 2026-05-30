import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { db } from '@/lib/db'

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Role type
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT' | 'BURSAR'

// NextAuth configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: {
            school: { select: { id: true, name: true, code: true } },
            staff: { select: { id: true, staffNumber: true, position: true } },
            student: { select: { id: true, studentNumber: true } },
          },
        })

        if (!user) {
          throw new Error('No account found with this email')
        }

        if (!user.isActive) {
          throw new Error('Your account has been deactivated. Contact administrator.')
        }

        const isValid = await verifyPassword(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid password')
        }

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          schoolId: user.schoolId ?? '',
          schoolName: user.school?.name ?? '',
          schoolCode: user.school?.code ?? '',
          staffId: user.staffId,
          studentId: user.studentId,
          staffNumber: user.staff?.staffNumber ?? null,
          studentNumber: user.student?.studentNumber ?? null,
          position: user.staff?.position ?? null,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as unknown as Record<string, unknown>).role as UserRole
        token.schoolId = (user as unknown as Record<string, unknown>).schoolId as string
        token.schoolName = (user as unknown as Record<string, unknown>).schoolName as string
        token.schoolCode = (user as unknown as Record<string, unknown>).schoolCode as string
        token.staffId = ((user as unknown as Record<string, unknown>).staffId as string) ?? null
        token.studentId = ((user as unknown as Record<string, unknown>).studentId as string) ?? null
        token.staffNumber = ((user as unknown as Record<string, unknown>).staffNumber as string) ?? null
        token.studentNumber = ((user as unknown as Record<string, unknown>).studentNumber as string) ?? null
        token.position = ((user as unknown as Record<string, unknown>).position as string) ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.schoolId = token.schoolId as string
        session.user.schoolName = token.schoolName as string
        session.user.schoolCode = token.schoolCode as string
        session.user.staffId = (token.staffId as string) ?? null
        session.user.studentId = (token.studentId as string) ?? null
        session.user.staffNumber = (token.staffNumber as string) ?? null
        session.user.studentNumber = (token.studentNumber as string) ?? null
        session.user.position = (token.position as string) ?? null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: (() => {
    const s = process.env.NEXTAUTH_SECRET
    if (!s) throw new Error('NEXTAUTH_SECRET environment variable is required. Generate one with: openssl rand -base64 32')
    return s
  })(),
}

// Type augmentation for next-auth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      schoolId: string
      schoolName: string
      schoolCode: string
      staffId: string | null
      studentId: string | null
      staffNumber: string | null
      studentNumber: string | null
      position: string | null
    }
  }

  interface User {
    role: UserRole
    schoolId: string
    schoolName: string
    schoolCode: string
    staffId: string | null
    studentId: string | null
    staffNumber: string | null
    studentNumber: string | null
    position: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    schoolId: string
    schoolName: string
    schoolCode: string
    staffId: string | null
    studentId: string | null
    staffNumber: string | null
    studentNumber: string | null
    position: string | null
  }
}

// Server-side auth helpers
import { getServerSession as getNextAuthSession } from 'next-auth'

export async function getServerSession() {
  return getNextAuthSession(authOptions)
}

export async function requireAuth() {
  const session = await getServerSession()
  if (!session?.user) {
    return null
  }
  return session
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await getServerSession()
  if (!session?.user) {
    return { error: 'Authentication required', status: 401 }
  }
  if (!allowedRoles.includes(session.user.role)) {
    return { error: 'Insufficient permissions', status: 403 }
  }
  return { session }
}
