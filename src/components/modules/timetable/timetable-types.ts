export interface RefClass { id: string; name: string }
export interface RefSubject { id: string; name: string }
export interface RefTeacher { id: string; name: string }

export interface UIEntry {
  id: string
  classId: string
  subjectId: string
  teacherId: string
  day: string
  period: number
  room: string
  subjectName: string
  className: string
  teacherName: string
}

export interface ApiEntry {
  id: string
  classId: string
  subjectId: string
  staffId: string | null
  dayOfWeek: number
  period: number
  room: string | null
  class?: { name: string } | null
  subject?: { name: string } | null
}

export interface TimetableResponse {
  data: ApiEntry[]
  total: number
  page: number
  totalPages: number
  stats: unknown
}

export interface AcademicsResponse {
  classes: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
}

export interface StaffResponse {
  data: { id: string; title: string | null; firstName: string; lastName: string }[]
  total: number
  page: number
  totalPages: number
}

export interface TimetableForm {
  classId: string
  subjectId: string
  teacherId: string
  day: string
  period: string
  room: string
}
