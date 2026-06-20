/**
 * ZimSchool Pro - Role-Based Access Control (RBAC) Utilities
 * Defines permission matrix and access control functions for all roles
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'BURSAR' | 'PARENT' | 'STUDENT'
export type Action = 'create' | 'read' | 'update' | 'delete'
export type Module = string

export interface Permission {
  module: string
  actions: Action[]
  fullAccess: boolean
}

// ─── Module Definitions ─────────────────────────────────────────────────────

export const MODULES = [
  'dashboard',
  'students',
  'staff',
  'admissions',
  'academics',
  'timetable',
  'attendance',
  'examinations',
  'elearning',
  'reports',
  'finance',
  'fee-calculator',
  'payroll',
  'procurement',
  'boarding',
  'transport',
  'library',
  'inventory',
  'canteen',
  'school-shop',
  'welfare',
  'discipline',
  'health',
  'alumni',
  'partnerships',
  'sdc',
  'events',
  'premium-templates',
  'notification-center',
  'communication',
  'documents',
  'security',
  'audit-log',
  'settings',
  'website-cms',
  'parent-portal',
  'student-portal',
  'teacher-portal',
  'setup-wizard',
  'zimsec-import',
  'bulk-operations',
] as const

export type ModuleId = typeof MODULES[number]

// ─── Permission Matrix ──────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: MODULES.map((module) => ({
    module,
    actions: ['create', 'read', 'update', 'delete'] as Action[],
    fullAccess: true,
  })),

  ADMIN: MODULES.map((module) => ({
    module,
    actions: ['create', 'read', 'update', 'delete'] as Action[],
    fullAccess: true,
  })),

  TEACHER: [
    { module: 'dashboard', actions: ['read'], fullAccess: false },
    { module: 'students', actions: ['read'], fullAccess: false },
    { module: 'staff', actions: ['read'], fullAccess: false },
    { module: 'academics', actions: ['create', 'read', 'update', 'delete'], fullAccess: true },
    { module: 'timetable', actions: ['create', 'read', 'update'], fullAccess: false },
    { module: 'attendance', actions: ['create', 'read', 'update'], fullAccess: true },
    { module: 'examinations', actions: ['create', 'read', 'update', 'delete'], fullAccess: true },
    { module: 'elearning', actions: ['create', 'read', 'update'], fullAccess: true },
    { module: 'reports', actions: ['read'], fullAccess: false },
    { module: 'library', actions: ['read'], fullAccess: false },
    { module: 'discipline', actions: ['create', 'read', 'update'], fullAccess: true },
    { module: 'health', actions: ['read'], fullAccess: false },
    { module: 'communication', actions: ['create', 'read'], fullAccess: false },
    { module: 'documents', actions: ['read'], fullAccess: false },
    { module: 'notification-center', actions: ['read'], fullAccess: false },
    { module: 'teacher-portal', actions: ['create', 'read', 'update'], fullAccess: true },
  ],

  BURSAR: [
    { module: 'dashboard', actions: ['read'], fullAccess: false },
    { module: 'students', actions: ['read'], fullAccess: false },
    { module: 'finance', actions: ['create', 'read', 'update', 'delete'], fullAccess: true },
    { module: 'fee-calculator', actions: ['create', 'read', 'update'], fullAccess: true },
    { module: 'payroll', actions: ['create', 'read', 'update', 'delete'], fullAccess: true },
    { module: 'canteen', actions: ['create', 'read', 'update'], fullAccess: true },
    { module: 'procurement', actions: ['create', 'read', 'update', 'delete'], fullAccess: true },
    { module: 'reports', actions: ['read'], fullAccess: false },
    { module: 'settings', actions: ['read', 'update'], fullAccess: false },
    { module: 'notification-center', actions: ['read'], fullAccess: false },
    { module: 'communication', actions: ['read'], fullAccess: false },
    { module: 'documents', actions: ['read'], fullAccess: false },
  ],

  PARENT: [
    { module: 'dashboard', actions: ['read'], fullAccess: false },
    { module: 'parent-portal', actions: ['read'], fullAccess: true },
    { module: 'finance', actions: ['read'], fullAccess: false },
    { module: 'fee-calculator', actions: ['read'], fullAccess: false },
    { module: 'communication', actions: ['create', 'read'], fullAccess: false },
    { module: 'notification-center', actions: ['read'], fullAccess: false },
    { module: 'reports', actions: ['read'], fullAccess: false },
  ],

  STUDENT: [
    { module: 'dashboard', actions: ['read'], fullAccess: false },
    { module: 'student-portal', actions: ['read'], fullAccess: true },
    { module: 'elearning', actions: ['read'], fullAccess: false },
    { module: 'library', actions: ['read'], fullAccess: false },
    { module: 'communication', actions: ['read'], fullAccess: false },
    { module: 'notification-center', actions: ['read'], fullAccess: false },
    { module: 'timetable', actions: ['read'], fullAccess: false },
  ],
}

// ─── Access Control Functions ───────────────────────────────────────────────

/**
 * Check if a role has access to a specific module
 */
export function hasPermission(role: UserRole, module: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.some((p) => p.module === module)
}

/**
 * Check if a role can perform a specific action on a module
 */
export function canPerformAction(role: UserRole, module: string, action: Action): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  const modulePermission = permissions.find((p) => p.module === module)
  if (!modulePermission) return false
  if (modulePermission.fullAccess) return true
  return modulePermission.actions.includes(action)
}

/**
 * Get all accessible modules for a role
 */
export function getAccessibleModules(role: UserRole): string[] {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.map((p) => p.module)
}

/**
 * Get full permission details for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Check if role has full access to a module
 */
export function hasFullAccess(role: UserRole, module: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  const modulePermission = permissions.find((p) => p.module === module)
  return modulePermission?.fullAccess || false
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Administrator',
    TEACHER: 'Teacher',
    BURSAR: 'Bursar',
    PARENT: 'Parent',
    STUDENT: 'Student',
  }
  return names[role] || role
}

/**
 * Get role color classes
 */
export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-200',
    ADMIN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    TEACHER: 'bg-blue-100 text-blue-700 border-blue-200',
    BURSAR: 'bg-amber-100 text-amber-700 border-amber-200',
    PARENT: 'bg-purple-100 text-purple-700 border-purple-200',
    STUDENT: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  }
  return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200'
}

/**
 * Get all available roles
 */
export function getAllRoles(): UserRole[] {
  return ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'BURSAR', 'PARENT', 'STUDENT']
}

/**
 * Get module display name
 */
export function getModuleDisplayName(moduleId: string): string {
  const names: Record<string, string> = {
    dashboard: 'Dashboard',
    students: 'Students',
    staff: 'Staff',
    admissions: 'Admissions',
    academics: 'Academics',
    timetable: 'Timetable',
    attendance: 'Attendance',
    examinations: 'Examinations',
    elearning: 'E-Learning',
    reports: 'Reports',
    finance: 'Finance',
    'fee-calculator': 'Fee Calculator',
    payroll: 'Payroll',
    procurement: 'Procurement',
    boarding: 'Boarding',
    transport: 'Transport',
    library: 'Library',
    inventory: 'Inventory',
    canteen: 'Canteen',
    welfare: 'Welfare',
    discipline: 'Discipline',
    health: 'Health',
    alumni: 'Alumni',
    sdc: 'SDC',
    events: 'Events & Sports',
    'notification-center': 'Notifications',
    communication: 'Communication',
    documents: 'Documents',
    security: 'Security',
    settings: 'Settings',
    'parent-portal': 'Parent Portal',
    'student-portal': 'Student Portal',
    'teacher-portal': 'Teacher Portal',
    'setup-wizard': 'Setup Wizard',
    'zimsec-import': 'ZIMSEC Import',
    'bulk-operations': 'Bulk Operations',
  }
  return names[moduleId] || moduleId
}
