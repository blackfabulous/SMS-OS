import type { ChartConfig } from '@/components/ui/chart'

export type ViewMode = 'list' | 'add' | 'edit' | 'detail' | 'settings'

export interface Application {
  id: string
  studentNumber: string
  firstName: string
  lastName: string
  middleName?: string
  gender: string
  dateOfBirth: string
  enrollmentStatus: string
  boardingStatus?: string
  previousSchool?: string
  admissionDate: string
  parentLinks: Array<{
    parent: { firstName: string; lastName: string; phone: string; email?: string }
    relationship: string
    isPrimary: boolean
  }>
  enrollments: Array<{
    class: { name: string; grade: { name: string } }
  }>
}

export interface AdmissionStats {
  total: number
  active: number
  pending: number
  droppedOut: number
  transferred: number
}

export interface AdmissionsResponse {
  data: Application[]
  total: number
  page: number
  totalPages: number
  stats: AdmissionStats
}

export interface ApplicationForm {
  firstName: string
  lastName: string
  middleName: string
  gender: string
  dateOfBirth: string
  birthCertNumber: string
  nationalId: string
  boardingStatus: string
  previousSchool: string
  guardianFirstName: string
  guardianLastName: string
  guardianPhone: string
  guardianEmail: string
  guardianRelationship: string
  gradeId: string
  status: string
}

export interface FunnelChartConfig {
  count: { label: string; color: string }
}

export const funnelChartConfig = {
  count: { label: 'Applicants', color: '#10b981' },
} satisfies ChartConfig
