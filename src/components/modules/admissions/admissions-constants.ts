import { CheckCircle2, Clock, Eye, XCircle, ListOrdered, ArrowRight } from 'lucide-react'
import type React from 'react'

export const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: Eye },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  WAITLISTED: { label: 'Waitlisted', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: ListOrdered },
  DROPPED_OUT: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  TRANSFERRED: { label: 'Transferred', color: 'bg-muted text-muted-foreground border-border', icon: ArrowRight },
}

export const defaultForm = {
  firstName: '',
  lastName: '',
  middleName: '',
  gender: 'MALE',
  dateOfBirth: '',
  birthCertNumber: '',
  nationalId: '',
  boardingStatus: 'DAY_SCHOLAR',
  previousSchool: '',
  guardianFirstName: '',
  guardianLastName: '',
  guardianPhone: '',
  guardianEmail: '',
  guardianRelationship: 'PARENT',
  gradeId: '',
  status: 'PENDING',
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}
