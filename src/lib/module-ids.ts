// Canonical list of dashboard module IDs. Kept in a server-safe file so it
// can be used in Server Components without pulling in 'use client' module registry.
export const MODULE_IDS = [
  'dashboard',
  'students',
  'staff',
  'admissions',
  'academics',
  'timetable',
  'attendance',
  'examinations',
  'zimsec-import',
  'elearning',
  'reports',
  'bulk-operations',
  'finance',
  'fee-calculator',
  'payroll',
  'procurement',
  'premium-templates',
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
  'parent-portal',
  'student-portal',
  'teacher-portal',
  'sdc',
  'events',
  'notification-center',
  'communication',
  'documents',
  'security',
  'settings',
  'setup-wizard',
  'website-cms',
] as const

export type ModuleId = (typeof MODULE_IDS)[number]

export function isModuleId(value: string): value is ModuleId {
  return (MODULE_IDS as readonly string[]).includes(value)
}
