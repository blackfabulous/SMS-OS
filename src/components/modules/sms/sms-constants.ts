import { Users, GraduationCap, UserCheck } from 'lucide-react'
import type { RecipientGroup, SmsTemplate } from './sms-types'

export const MAX_SMS_LENGTH = 160

export const recipientGroups: RecipientGroup[] = [
  { id: 'all_parents', label: 'All Parents', icon: Users, count: 145, description: 'Send to all parents with children enrolled' },
  { id: 'class_parents', label: 'By Class', icon: GraduationCap, count: 35, description: 'Parents of students in a specific class' },
  { id: 'grade_parents', label: 'By Grade', icon: GraduationCap, count: 52, description: 'Parents of students in a grade level' },
  { id: 'individual', label: 'Individual', icon: UserCheck, count: 1, description: 'Send to specific phone number(s)' },
]

export const smsTemplates: SmsTemplate[] = [
  { id: 'fee_reminder', name: 'Fee Reminder', category: 'Finance', content: 'Dear Parent, your child has an outstanding fee balance. Please arrange payment at your earliest convenience. Contact the bursar for details. - ZimSchool' },
  { id: 'attendance_alert', name: 'Attendance Alert', category: 'Attendance', content: 'Dear Parent, your child was marked absent today. Please contact the school office if this is an error. - ZimSchool' },
  { id: 'exam_notice', name: 'Exam Notice', category: 'Academics', content: 'Dear Parent, end-of-term examinations begin soon. Please ensure your child is well prepared and arrives on time. - ZimSchool' },
  { id: 'meeting_notice', name: 'Meeting Notice', category: 'Meetings', content: 'Dear Parent, you are invited to attend the SDC meeting. Your attendance is valued. - ZimSchool' },
  { id: 'school_closure', name: 'School Closure', category: 'Emergency', content: 'URGENT: School will be closed. Please make alternative arrangements for your children. - ZimSchool' },
  { id: 'sports_event', name: 'Sports Event', category: 'Events', content: 'Dear Parent, the inter-house athletics competition will be held soon. Come support your child! - ZimSchool' },
  { id: 'parent_teacher', name: 'Parent-Teacher Conference', category: 'Meetings', content: "Dear Parent, the Parent-Teacher Conference is scheduled. Please attend to discuss your child's progress. - ZimSchool" },
  { id: 'results_available', name: 'Results Available', category: 'Academics', content: 'Dear Parent, term results are now available. Please visit the school to collect your child\'s report card. - ZimSchool' },
]

export const availableClasses = [
  'Form 1A', 'Form 1B', 'Form 2A', 'Form 2B', 'Form 3A', 'Form 3B',
  'Form 4A', 'Form 4B', 'Form 5A', 'Form 6A',
]

export const availableGrades = [
  'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6',
]
