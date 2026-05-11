# Task 1 - Real Authentication with NextAuth.js and RBAC

## Work Log

### Completed Tasks

1. **Updated Prisma Schema** - Added `User` model with:
   - Fields: id, email, password, name, role, staffId, studentId, parentId, schoolId, isActive, lastLogin, createdAt, updatedAt
   - Role types: ADMIN, TEACHER, PARENT, STUDENT, BURSAR
   - Relations to School, Staff, Student models
   - Added `users User[]` to School, `user User?` to Staff and Student models
   - Unique constraints on email, staffId, studentId
   - Ran `bun run db:push` successfully

2. **Installed bcrypt** - `bun add bcrypt @types/bcrypt`

3. **Created `/src/lib/auth.ts`** - Authentication utilities:
   - `hashPassword()` and `verifyPassword()` using bcrypt
   - `UserRole` type
   - `authOptions` for NextAuth.js v4:
     - Credentials provider (email + password)
     - JWT strategy with 30-day maxAge
     - Session callbacks with role, schoolId, staffId, studentId, etc.
     - Updates lastLogin on successful auth
   - TypeScript type augmentation for Session, User, JWT
   - `getServerSession()` wrapper
   - `requireAuth()` and `requireRole()` server-side helpers

4. **Created `/src/app/api/auth/[...nextauth]/route.ts`** - NextAuth API route handler

5. **Created `/src/lib/api-auth.ts`** - API route auth helpers:
   - `validateAuth()` - checks session exists
   - `validateRole(allowedRoles)` - checks session + role
   - `validateSchoolAccess(schoolId)` - checks session + school ownership

6. **Created `/prisma/seed-users.ts`** - Seed script for default users:
   - admin@zimschool.co.zw (ADMIN) / password123
   - teacher@zimschool.co.zw (TEACHER) / password123
   - parent@zimschool.co.zw (PARENT) / password123
   - student@zimschool.co.zw (STUDENT) / password123
   - bursar@zimschool.co.zw (BURSAR) / password123
   - All passwords hashed with bcrypt

7. **Created `/src/components/auth-provider.tsx`** - AuthProvider component:
   - Wraps app with NextAuth SessionProvider
   - Fetches session on mount
   - Shows loading spinner while session loads

8. **Updated `/src/app/layout.tsx`** - Wrapped children with AuthProvider

9. **Updated LoginPage component** in `/src/app/page.tsx`:
   - Replaced simulated login with real `signIn('credentials', ...)` from NextAuth
   - Added `loginError` state and error display UI
   - Updated default password to 'password123'
   - Error handling with shake animation and toast notifications

10. **Updated Home component** in `/src/app/page.tsx`:
    - Replaced `isLoggedIn` state with `useSession()` from NextAuth
    - Shows loading spinner while session loads
    - Shows LoginPage if no session
    - User info from session (name, initials, role) displayed in sidebar and header
    - `handleLogout` now calls `signOut({ redirect: false })`
    - RBAC hook initialized with session role: `useRBAC((session?.user?.role as UserRole) || 'ADMIN')`

11. **Updated AppSidebar** - Accepts and displays userName, userRole, userInitials from session

12. **Updated AppHeader** - Accepts and displays userName, userInitials from session

13. **Added auth to API routes**:
    - `/api/students` - GET requires auth, POST requires ADMIN/TEACHER/BURSAR role
    - `/api/staff` - GET requires auth, POST requires ADMIN role
    - `/api/finance` - GET requires ADMIN/BURSAR/TEACHER role
    - `/api/attendance` - GET requires auth, POST requires ADMIN/TEACHER role
    - `/api/dashboard` - GET requires auth

14. **Fixed lint errors**:
    - Added Select component imports
    - Fixed useMemo dependency for rbac
    - Fixed pre-existing use-notifications.ts lint warning
    - Added X import to teacher-portal-module
    - All lint checks pass with 0 errors

### Test Results
- Login via NextAuth works (POST /api/auth/callback/credentials returns 302 redirect on success)
- Session endpoint works (GET /api/auth/session)
- CSRF token endpoint works (GET /api/auth/csrf)
- Providers endpoint works (GET /api/auth/providers)
- Database queries for User authentication work correctly
- lastLogin updated on successful authentication
- API routes return 401 when not authenticated

### Files Created
- `/src/lib/auth.ts`
- `/src/lib/api-auth.ts`
- `/src/components/auth-provider.tsx`
- `/src/app/api/auth/[...nextauth]/route.ts`
- `/prisma/seed-users.ts`

### Files Modified
- `/prisma/schema.prisma` - Added User model + relations
- `/src/app/layout.tsx` - Added AuthProvider wrapper
- `/src/app/page.tsx` - Real NextAuth integration
- `/src/app/api/students/route.ts` - Auth validation
- `/src/app/api/staff/route.ts` - Auth validation
- `/src/app/api/finance/route.ts` - Auth validation
- `/src/app/api/attendance/route.ts` - Auth validation
- `/src/app/api/dashboard/route.ts` - Auth validation
- `/src/hooks/use-notifications.ts` - Lint fix
