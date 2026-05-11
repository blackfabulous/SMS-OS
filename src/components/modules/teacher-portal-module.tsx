'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  CalendarCheck,
  Clock,
  Bell,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  MessageSquare,
  Calendar,
  Save,
  Download,
  Upload,
  UserCheck,
  UserX,
  Timer,
  Smile,
  Edit3,
  Eye,
  AlertTriangle,
  Star,
  Zap,
  FolderOpen,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── ZIMSEC Grading Helper ────────────────────────────────────────────────────
function getZimsecGrade(mark: number): string {
  if (mark >= 90) return 'A*'
  if (mark >= 80) return 'A'
  if (mark >= 70) return 'B'
  if (mark >= 60) return 'C'
  if (mark >= 50) return 'D'
  if (mark >= 40) return 'E'
  return 'U'
}

function gradeColor(grade: string): string {
  if (grade === 'A*') return 'text-emerald-600 bg-emerald-50'
  if (grade === 'A') return 'text-emerald-600 bg-emerald-50'
  if (grade === 'B') return 'text-teal-600 bg-teal-50'
  if (grade === 'C') return 'text-amber-600 bg-amber-50'
  if (grade === 'D') return 'text-orange-600 bg-orange-50'
  if (grade === 'E') return 'text-red-500 bg-red-50'
  return 'text-red-700 bg-red-100'
}

function gradeTextColor(grade: string): string {
  if (grade === 'A*' || grade === 'A') return 'text-emerald-600'
  if (grade === 'B') return 'text-teal-600'
  if (grade === 'C') return 'text-amber-600'
  if (grade === 'D') return 'text-orange-600'
  if (grade === 'E') return 'text-red-500'
  return 'text-red-700'
}

// ─── Mock Data (fallback) ───────────────────────────────────────────────────────
const teacherName = 'Mr. Tendai Hove'
const teacherInitials = 'TH'
const teacherSubject = 'Mathematics & Physics'
const teacherClass = 'Form 4A'

interface TeacherClass {
  id: string
  name: string
  subject: string
  studentCount: number
  avgPerformance: number
  attendanceRate: number
  upcomingAssessments: string[]
  gradeDistribution: { grade: string; count: number }[]
  students: StudentInClass[]
}

interface StudentInClass {
  id: string
  name: string
  initials: string
  studentNumber: string
  avgMark: number
  grade: string
  attendance: number
}

const mockClasses: TeacherClass[] = [
  {
    id: 'c1',
    name: 'Form 3A',
    subject: 'Mathematics',
    studentCount: 38,
    avgPerformance: 68,
    attendanceRate: 92,
    upcomingAssessments: ['Mid-Term Test - Mar 15', 'Assignment 4 - Mar 22'],
    gradeDistribution: [
      { grade: 'A*', count: 3 },
      { grade: 'A', count: 5 },
      { grade: 'B', count: 8 },
      { grade: 'C', count: 10 },
      { grade: 'D', count: 7 },
      { grade: 'E', count: 3 },
      { grade: 'U', count: 2 },
    ],
    students: [
      { id: 's1', name: 'Tendai Moyo', initials: 'TM', studentNumber: 'STD-2024-001', avgMark: 85, grade: 'A', attendance: 96 },
      { id: 's2', name: 'Chido Ndlovu', initials: 'CN', studentNumber: 'STD-2024-002', avgMark: 72, grade: 'B', attendance: 94 },
      { id: 's3', name: 'Kudzai Chikumbu', initials: 'KC', studentNumber: 'STD-2024-003', avgMark: 58, grade: 'D', attendance: 88 },
      { id: 's4', name: 'Rumbidzai Dube', initials: 'RD', studentNumber: 'STD-2024-004', avgMark: 91, grade: 'A*', attendance: 98 },
      { id: 's5', name: 'Tapiwa Gumbo', initials: 'TG', studentNumber: 'STD-2024-005', avgMark: 64, grade: 'C', attendance: 90 },
      { id: 's6', name: 'Nyasha Sithole', initials: 'NS', studentNumber: 'STD-2024-006', avgMark: 77, grade: 'B', attendance: 92 },
      { id: 's7', name: 'Munashe Zvambe', initials: 'MZ', studentNumber: 'STD-2024-007', avgMark: 45, grade: 'E', attendance: 82 },
      { id: 's8', name: 'Panashe Chikumba', initials: 'PC', studentNumber: 'STD-2024-008', avgMark: 83, grade: 'A', attendance: 95 },
      { id: 's9', name: 'Tanaka Mhungu', initials: 'TM', studentNumber: 'STD-2024-009', avgMark: 56, grade: 'D', attendance: 86 },
      { id: 's10', name: 'Rutendo Marime', initials: 'RM', studentNumber: 'STD-2024-010', avgMark: 69, grade: 'C', attendance: 91 },
      { id: 's11', name: 'Farai Chitezve', initials: 'FC', studentNumber: 'STD-2024-011', avgMark: 74, grade: 'B', attendance: 93 },
      { id: 's12', name: 'Shamiso Bera', initials: 'SB', studentNumber: 'STD-2024-012', avgMark: 38, grade: 'U', attendance: 79 },
      { id: 's13', name: 'Nhamo Gondo', initials: 'NG', studentNumber: 'STD-2024-013', avgMark: 62, grade: 'C', attendance: 89 },
      { id: 's14', name: 'Chiedza Motsi', initials: 'CM', studentNumber: 'STD-2024-014', avgMark: 88, grade: 'A', attendance: 97 },
      { id: 's15', name: 'Blessing Shumba', initials: 'BS', studentNumber: 'STD-2024-015', avgMark: 51, grade: 'D', attendance: 85 },
    ],
  },
  {
    id: 'c2',
    name: 'Form 4A',
    subject: 'Mathematics',
    studentCount: 35,
    avgPerformance: 72,
    attendanceRate: 94,
    upcomingAssessments: ['ZIMSEC Mock - Apr 5', 'End of Term Exam - May 18'],
    gradeDistribution: [
      { grade: 'A*', count: 4 },
      { grade: 'A', count: 6 },
      { grade: 'B', count: 9 },
      { grade: 'C', count: 8 },
      { grade: 'D', count: 5 },
      { grade: 'E', count: 2 },
      { grade: 'U', count: 1 },
    ],
    students: [
      { id: 's16', name: 'Tatenda Chirwa', initials: 'TC', studentNumber: 'STD-2023-001', avgMark: 92, grade: 'A*', attendance: 98 },
      { id: 's17', name: 'Privilege Ncube', initials: 'PN', studentNumber: 'STD-2023-002', avgMark: 78, grade: 'B', attendance: 95 },
      { id: 's18', name: 'Simbarashe Makoni', initials: 'SM', studentNumber: 'STD-2023-003', avgMark: 65, grade: 'C', attendance: 91 },
      { id: 's19', name: 'Nomathemba Sibanda', initials: 'NS', studentNumber: 'STD-2023-004', avgMark: 87, grade: 'A', attendance: 96 },
      { id: 's20', name: 'Bongani Tshuma', initials: 'BT', studentNumber: 'STD-2023-005', avgMark: 54, grade: 'D', attendance: 87 },
      { id: 's21', name: 'Sithandwe Dlamini', initials: 'SD', studentNumber: 'STD-2023-006', avgMark: 71, grade: 'B', attendance: 93 },
      { id: 's22', name: 'Zweli Khumalo', initials: 'ZK', studentNumber: 'STD-2023-007', avgMark: 43, grade: 'E', attendance: 80 },
      { id: 's23', name: 'Lindiwe Mthethwa', initials: 'LM', studentNumber: 'STD-2023-008', avgMark: 81, grade: 'A', attendance: 97 },
      { id: 's24', name: 'Thabo Mkhize', initials: 'TM', studentNumber: 'STD-2023-009', avgMark: 59, grade: 'D', attendance: 88 },
      { id: 's25', name: 'Zanele Nkosi', initials: 'ZN', studentNumber: 'STD-2023-010', avgMark: 76, grade: 'B', attendance: 94 },
      { id: 's26', name: 'Mthandeni Ndaba', initials: 'MN', studentNumber: 'STD-2023-011', avgMark: 68, grade: 'C', attendance: 90 },
      { id: 's27', name: 'Philani Mnguni', initials: 'PM', studentNumber: 'STD-2023-012', avgMark: 35, grade: 'U', attendance: 76 },
      { id: 's28', name: 'Thandeka Zulu', initials: 'TZ', studentNumber: 'STD-2023-013', avgMark: 73, grade: 'B', attendance: 92 },
      { id: 's29', name: 'Sibusiso Cele', initials: 'SC', studentNumber: 'STD-2023-014', avgMark: 62, grade: 'C', attendance: 89 },
      { id: 's30', name: 'Nqobile Mkhwanazi', initials: 'NM', studentNumber: 'STD-2023-015', avgMark: 84, grade: 'A', attendance: 96 },
    ],
  },
  {
    id: 'c3',
    name: 'Form 5A',
    subject: 'Mathematics',
    studentCount: 28,
    avgPerformance: 75,
    attendanceRate: 96,
    upcomingAssessments: ['A-Level Test 2 - Mar 18', 'Coursework Submission - Mar 25'],
    gradeDistribution: [
      { grade: 'A*', count: 5 },
      { grade: 'A', count: 7 },
      { grade: 'B', count: 8 },
      { grade: 'C', count: 5 },
      { grade: 'D', count: 2 },
      { grade: 'E', count: 1 },
      { grade: 'U', count: 0 },
    ],
    students: [
      { id: 's31', name: 'Njabulo Hlatshwayo', initials: 'NH', studentNumber: 'STD-2022-001', avgMark: 94, grade: 'A*', attendance: 99 },
      { id: 's32', name: 'Zodwa Vilakazi', initials: 'ZV', studentNumber: 'STD-2022-002', avgMark: 82, grade: 'A', attendance: 97 },
      { id: 's33', name: 'Mxolisi Mthembu', initials: 'MM', studentNumber: 'STD-2022-003', avgMark: 70, grade: 'B', attendance: 95 },
      { id: 's34', name: 'Thulisile Dladla', initials: 'TD', studentNumber: 'STD-2022-004', avgMark: 88, grade: 'A', attendance: 98 },
      { id: 's35', name: 'Bhekumuzi Gumede', initials: 'BG', studentNumber: 'STD-2022-005', avgMark: 63, grade: 'C', attendance: 91 },
      { id: 's36', name: 'Nonhlanhla Mthiyane', initials: 'NM', studentNumber: 'STD-2022-006', avgMark: 77, grade: 'B', attendance: 94 },
      { id: 's37', name: 'Sphamandla Ngcobo', initials: 'SN', studentNumber: 'STD-2022-007', avgMark: 49, grade: 'E', attendance: 83 },
      { id: 's38', name: 'Nompumelelo Mchunu', initials: 'NM', studentNumber: 'STD-2022-008', avgMark: 85, grade: 'A', attendance: 96 },
      { id: 's39', name: 'Kagiso Phiri', initials: 'KP', studentNumber: 'STD-2022-009', avgMark: 71, grade: 'B', attendance: 93 },
      { id: 's40', name: 'Mmapula Mokone', initials: 'MM', studentNumber: 'STD-2022-010', avgMark: 58, grade: 'D', attendance: 88 },
      { id: 's41', name: 'Thabo Letlape', initials: 'TL', studentNumber: 'STD-2022-011', avgMark: 90, grade: 'A*', attendance: 99 },
      { id: 's42', name: 'Dineo Modise', initials: 'DM', studentNumber: 'STD-2022-012', avgMark: 66, grade: 'C', attendance: 90 },
      { id: 's43', name: 'Karabo Molefe', initials: 'KM', studentNumber: 'STD-2022-013', avgMark: 73, grade: 'B', attendance: 92 },
      { id: 's44', name: 'Lerato Phakoe', initials: 'LP', studentNumber: 'STD-2022-014', avgMark: 92, grade: 'A*', attendance: 98 },
      { id: 's45', name: 'Tshego Moagi', initials: 'TM', studentNumber: 'STD-2022-015', avgMark: 79, grade: 'B', attendance: 95 },
    ],
  },
  {
    id: 'c4',
    name: 'Form 6A',
    subject: 'Physics',
    studentCount: 27,
    avgPerformance: 70,
    attendanceRate: 93,
    upcomingAssessments: ['A-Level Practical - Mar 20', 'Term Exam - May 20'],
    gradeDistribution: [
      { grade: 'A*', count: 3 },
      { grade: 'A', count: 5 },
      { grade: 'B', count: 7 },
      { grade: 'C', count: 6 },
      { grade: 'D', count: 4 },
      { grade: 'E', count: 1 },
      { grade: 'U', count: 1 },
    ],
    students: [
      { id: 's46', name: 'Rumbidzai Ncube', initials: 'RN', studentNumber: 'STD-2021-001', avgMark: 93, grade: 'A*', attendance: 99 },
      { id: 's47', name: 'Tendai Gwarava', initials: 'TG', studentNumber: 'STD-2021-002', avgMark: 78, grade: 'B', attendance: 95 },
      { id: 's48', name: 'Kudzai Mutasa', initials: 'KM', studentNumber: 'STD-2021-003', avgMark: 64, grade: 'C', attendance: 90 },
      { id: 's49', name: 'Nyarai Chigwada', initials: 'NC', studentNumber: 'STD-2021-004', avgMark: 86, grade: 'A', attendance: 97 },
      { id: 's50', name: 'Tafadzwa Mapfumo', initials: 'TM', studentNumber: 'STD-2021-005', avgMark: 52, grade: 'D', attendance: 85 },
      { id: 's51', name: 'Mutsa Dhliwayo', initials: 'MD', studentNumber: 'STD-2021-006', avgMark: 74, grade: 'B', attendance: 93 },
      { id: 's52', name: 'Anesu Gwevedzi', initials: 'AG', studentNumber: 'STD-2021-007', avgMark: 41, grade: 'E', attendance: 81 },
      { id: 's53', name: 'Shamiso Nyamayaro', initials: 'SN', studentNumber: 'STD-2021-008', avgMark: 82, grade: 'A', attendance: 96 },
      { id: 's54', name: 'Payi Gweshe', initials: 'PG', studentNumber: 'STD-2021-009', avgMark: 57, grade: 'D', attendance: 87 },
      { id: 's55', name: 'Tinotenda Chidavaenzi', initials: 'TC', studentNumber: 'STD-2021-010', avgMark: 69, grade: 'C', attendance: 91 },
      { id: 's56', name: 'Pamberi Chinamora', initials: 'PC', studentNumber: 'STD-2021-011', avgMark: 75, grade: 'B', attendance: 94 },
      { id: 's57', name: 'Rumbidzai Jambaya', initials: 'RJ', studentNumber: 'STD-2021-012', avgMark: 33, grade: 'U', attendance: 75 },
      { id: 's58', name: 'Munashe Mutsindikwa', initials: 'MM', studentNumber: 'STD-2021-013', avgMark: 67, grade: 'C', attendance: 89 },
      { id: 's59', name: 'Kundai Muchenje', initials: 'KM', studentNumber: 'STD-2021-014', avgMark: 88, grade: 'A', attendance: 97 },
      { id: 's60', name: 'Nompilo Dube', initials: 'ND', studentNumber: 'STD-2021-015', avgMark: 72, grade: 'B', attendance: 93 },
    ],
  },
]

// ─── Today's Schedule ──────────────────────────────────────────────────────────
const todaySchedule = [
  { period: 1, time: '7:30 - 8:15', subject: 'Mathematics', class: 'Form 3A', room: 'Room 12', color: 'bg-emerald-500' },
  { period: 2, time: '8:20 - 9:05', subject: 'Mathematics', class: 'Form 4A', room: 'Room 12', color: 'bg-teal-500' },
  { period: 3, time: '9:10 - 9:55', subject: 'Free Period', class: '—', room: '—', color: 'bg-gray-300' },
  { period: 4, time: '10:10 - 10:55', subject: 'Physics', class: 'Form 6A', room: 'Lab 2', color: 'bg-violet-500' },
  { period: 5, time: '11:00 - 11:45', subject: 'Mathematics', class: 'Form 5A', room: 'Room 14', color: 'bg-amber-500' },
  { period: 6, time: '11:50 - 12:35', subject: 'Free Period', class: '—', room: '—', color: 'bg-gray-300' },
]

// ─── Assignments Data ──────────────────────────────────────────────────────────
interface Assignment {
  id: string
  title: string
  subject: string
  className: string
  dueDate: string
  maxMarks: number
  description: string
  status: 'Active' | 'Grading' | 'Closed'
  submitted: number
  total: number
  avgScore: number | null
  graded: number
}

const mockAssignments: Assignment[] = [
  { id: 'a1', title: 'Quadratic Equations Problem Set', subject: 'Mathematics', className: 'Form 3A', dueDate: '2026-03-15', maxMarks: 100, description: 'Solve problems 1-20 from Chapter 7. Show all working.', status: 'Active', submitted: 22, total: 38, avgScore: null, graded: 0 },
  { id: 'a2', title: 'Trigonometry Assignment', subject: 'Mathematics', className: 'Form 4A', dueDate: '2026-03-12', maxMarks: 100, description: 'Complete the trigonometry worksheet. Include diagrams.', status: 'Grading', submitted: 35, total: 35, avgScore: 71, graded: 28 },
  { id: 'a3', title: 'Calculus: Derivatives', subject: 'Mathematics', className: 'Form 5A', dueDate: '2026-03-18', maxMarks: 100, description: 'Differentiation techniques practice. Problems 1-15.', status: 'Active', submitted: 18, total: 28, avgScore: null, graded: 0 },
  { id: 'a4', title: 'Mechanics Practical Report', subject: 'Physics', className: 'Form 6A', dueDate: '2026-03-10', maxMarks: 100, description: 'Write up the Hooke\'s Law experiment from Lab 4.', status: 'Grading', submitted: 27, total: 27, avgScore: 68, graded: 22 },
  { id: 'a5', title: 'Geometry & Measurement Test', subject: 'Mathematics', className: 'Form 3A', dueDate: '2026-03-01', maxMarks: 100, description: 'In-class test covering Chapters 5-6.', status: 'Closed', submitted: 38, total: 38, avgScore: 65, graded: 38 },
  { id: 'a6', title: 'ZIMSEC Mock Paper 1', subject: 'Mathematics', className: 'Form 4A', dueDate: '2026-02-28', maxMarks: 100, description: 'Complete ZIMSEC 2024 Paper 1 under exam conditions.', status: 'Closed', submitted: 35, total: 35, avgScore: 72, graded: 35 },
  { id: 'a7', title: 'Integration Techniques', subject: 'Mathematics', className: 'Form 5A', dueDate: '2026-03-20', maxMarks: 100, description: 'Integration by parts and substitution. Problems 1-12.', status: 'Active', submitted: 8, total: 28, avgScore: null, graded: 0 },
  { id: 'a8', title: 'Electromagnetism Problem Set', subject: 'Physics', className: 'Form 6A', dueDate: '2026-03-22', maxMarks: 100, description: 'Solve all problems on electromagnetic induction from Chapter 9.', status: 'Active', submitted: 5, total: 27, avgScore: null, graded: 0 },
]

// ─── Performance Alerts ────────────────────────────────────────────────────────
const performanceAlerts = [
  { id: 1, student: 'Munashe Zvambe', class: 'Form 3A', type: 'critical' as const, message: 'Average mark dropped to 45% (E grade). At risk of failing.' },
  { id: 2, student: 'Shamiso Bera', class: 'Form 3A', type: 'critical' as const, message: 'Consistent U grade. Needs immediate intervention.' },
  { id: 3, student: 'Rumbidzai Dube', class: 'Form 3A', type: 'positive' as const, message: 'Outstanding performance! 91% average - A* grade.' },
  { id: 4, student: 'Zweli Khumalo', class: 'Form 4A', type: 'warning' as const, message: 'Attendance at 80%. Marks declining - was C, now E.' },
  { id: 5, student: 'Panashe Chikumba', class: 'Form 3A', type: 'positive' as const, message: 'Improved from C to A. Great progress this term!' },
  { id: 6, student: 'Rumbidzai Jambaya', class: 'Form 6A', type: 'critical' as const, message: 'Physics mark at 33%. Chronic absenteeism (75% attendance).' },
]

// ─── Weekly Schedule Grid ──────────────────────────────────────────────────────
interface ScheduleSlot {
  subject: string
  class: string
  room: string
  isFree: boolean
  isSubstitute?: boolean
  originalTeacher?: string
}

const weeklySchedule: Record<string, Record<number, ScheduleSlot>> = {
  Monday: {
    1: { subject: 'Mathematics', class: 'Form 3A', room: 'Room 12', isFree: false },
    2: { subject: 'Mathematics', class: 'Form 4A', room: 'Room 12', isFree: false },
    3: { subject: 'Free', class: '', room: '', isFree: true },
    4: { subject: 'Physics', class: 'Form 6A', room: 'Lab 2', isFree: false },
    5: { subject: 'Mathematics', class: 'Form 5A', room: 'Room 14', isFree: false },
    6: { subject: 'Free', class: '', room: '', isFree: true },
    7: { subject: 'Free', class: '', room: '', isFree: true },
    8: { subject: 'Free', class: '', room: '', isFree: true },
  },
  Tuesday: {
    1: { subject: 'Mathematics', class: 'Form 5A', room: 'Room 14', isFree: false },
    2: { subject: 'Physics', class: 'Form 6A', room: 'Lab 2', isFree: false },
    3: { subject: 'Mathematics', class: 'Form 3A', room: 'Room 12', isFree: false },
    4: { subject: 'Free', class: '', room: '', isFree: true },
    5: { subject: 'Mathematics', class: 'Form 4A', room: 'Room 12', isFree: false },
    6: { subject: 'Free', class: '', room: '', isFree: true },
    7: { subject: 'Free', class: '', room: '', isFree: true },
    8: { subject: 'Free', class: '', room: '', isFree: true },
  },
  Wednesday: {
    1: { subject: 'Physics', class: 'Form 6A', room: 'Lab 2', isFree: false },
    2: { subject: 'Mathematics', class: 'Form 3A', room: 'Room 12', isFree: false },
    3: { subject: 'Free', class: '', room: '', isFree: true },
    4: { subject: 'Mathematics', class: 'Form 5A', room: 'Room 14', isFree: false },
    5: { subject: 'Free', class: '', room: '', isFree: true },
    6: { subject: 'Mathematics', class: 'Form 4A', room: 'Room 12', isFree: false },
    7: { subject: 'Free', class: '', room: '', isFree: true },
    8: { subject: 'Free', class: '', room: '', isFree: true },
  },
  Thursday: {
    1: { subject: 'Mathematics', class: 'Form 4A', room: 'Room 12', isFree: false },
    2: { subject: 'Free', class: '', room: '', isFree: true },
    3: { subject: 'Physics', class: 'Form 6A', room: 'Lab 2', isFree: false, isSubstitute: true, originalTeacher: 'Mrs. Ncube' },
    4: { subject: 'Mathematics', class: 'Form 3A', room: 'Room 12', isFree: false },
    5: { subject: 'Free', class: '', room: '', isFree: true },
    6: { subject: 'Mathematics', class: 'Form 5A', room: 'Room 14', isFree: false },
    7: { subject: 'Free', class: '', room: '', isFree: true },
    8: { subject: 'Free', class: '', room: '', isFree: true },
  },
  Friday: {
    1: { subject: 'Free', class: '', room: '', isFree: true },
    2: { subject: 'Mathematics', class: 'Form 5A', room: 'Room 14', isFree: false },
    3: { subject: 'Mathematics', class: 'Form 3A', room: 'Room 12', isFree: false },
    4: { subject: 'Free', class: '', room: '', isFree: true },
    5: { subject: 'Physics', class: 'Form 6A', room: 'Lab 2', isFree: false },
    6: { subject: 'Mathematics', class: 'Form 4A', room: 'Room 12', isFree: false },
    7: { subject: 'Free', class: '', room: '', isFree: true },
    8: { subject: 'Free', class: '', room: '', isFree: true },
  },
}

// ─── Chart Config ──────────────────────────────────────────────────────────────
const gradeDistChartConfig = {
  count: { label: 'Students', color: '#10b981' },
} satisfies ChartConfig

// ─── Component ─────────────────────────────────────────────────────────────────
export default function TeacherPortalModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedClass, setExpandedClass] = useState<string | null>(null)

  // ─── API Data State ───────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<TeacherClass[]>(mockClasses)
  const [teacherAssignments, setTeacherAssignments] = useState<Assignment[]>(mockAssignments)
  const [loading, setLoading] = useState({ classes: true, assignments: true })

  // ─── Fetch from APIs ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch('/api/students?limit=100&enrollmentStatus=ACTIVE')
        if (res.ok) {
          const json = await res.json()
          if (json.data && json.data.length > 0) {
            // Group students by class to build teacher classes
            const classMap = new Map<string, { name: string; students: StudentInClass[] }>()
            for (const s of json.data as Record<string, unknown>[]) {
              const enrollment = (s as Record<string, unknown[]>).enrollments?.[0] as Record<string, Record<string, string>> | undefined
              const className = enrollment?.class?.name || 'Unassigned'
              if (!classMap.has(className)) {
                classMap.set(className, { name: className, students: [] })
              }
              classMap.get(className)!.students.push({
                id: s.id as string,
                name: `${s.firstName} ${s.lastName}`,
                initials: `${(s.firstName as string)[0]}${(s.lastName as string)[0]}`,
                studentNumber: s.studentNumber as string,
                avgMark: 0,
                grade: '—',
                attendance: 0,
              })
            }
            if (classMap.size > 0) {
              const apiClasses: TeacherClass[] = Array.from(classMap.entries()).map(([id, data], idx) => ({
                id: `c${idx}`,
                name: data.name,
                subject: idx % 2 === 0 ? 'Mathematics' : 'Physics',
                studentCount: data.students.length,
                avgPerformance: 0,
                attendanceRate: 0,
                upcomingAssessments: [],
                gradeDistribution: [],
                students: data.students,
              }))
              setClasses(apiClasses.length > 0 ? apiClasses : mockClasses)
            }
          }
        }
      } catch { /* fallback to mock */ }
      setLoading(prev => ({ ...prev, classes: false }))
    }
    fetchClasses()
  }, [])

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const res = await fetch('/api/elearning?type=assignments')
        if (res.ok) {
          const json = await res.json()
          if (json.data && json.data.length > 0) {
            const apiAssignments: Assignment[] = json.data.map((a: Record<string, unknown>) => ({
              id: a.id as string,
              title: a.title as string,
              subject: (a.course as Record<string, string>)?.name || 'General',
              className: (a.course as Record<string, string>)?.name || 'General',
              dueDate: a.dueDate ? new Date(a.dueDate as string).toISOString().split('T')[0] : '',
              maxMarks: a.maxMarks as number || 100,
              description: a.description as string || '',
              status: ((a.status as string) || 'OPEN').toLowerCase() === 'closed' ? 'Closed' : ((a.status as string) || 'OPEN').toLowerCase() === 'grading' ? 'Grading' : 'Active',
              submitted: a.submissionsCount as number || 0,
              total: a.submissionsCount as number || 0,
              avgScore: a.avgScore as number || null,
              graded: 0,
            }))
            setTeacherAssignments(apiAssignments.length > 0 ? apiAssignments : mockAssignments)
          }
        }
      } catch { /* fallback to mock */ }
      setLoading(prev => ({ ...prev, assignments: false }))
    }
    fetchAssignments()
  }, [])

  // Marks Entry State
  const [selectedGrade, setSelectedGrade] = useState('Form 4A')
  const [selectedSubject, setSelectedSubject] = useState('Mathematics')
  const [selectedAssessment, setSelectedAssessment] = useState('Mid-Term')
  const [studentMarks, setStudentMarks] = useState<Record<string, string>>({})
  const [marksSaved, setMarksSaved] = useState(false)

  // Assignments State
  const [createAssignOpen, setCreateAssignOpen] = useState(false)
  const [gradeAssignOpen, setGradeAssignOpen] = useState<string | null>(null)
  const [assignmentMarks, setAssignmentMarks] = useState<Record<string, string>>({})

  // Attendance State
  const [attendanceClass, setAttendanceClass] = useState('Form 3A')
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({})

  // ─── Computed Values ───────────────────────────────────────────────────────
  const currentClassForMarks = classes.find(c => c.name === selectedGrade)
  const currentClassForAttendance = classes.find(c => c.name === attendanceClass)

  const marksForCurrentClass = useMemo(() => {
    if (!currentClassForMarks) return []
    return currentClassForMarks.students.map(s => ({
      ...s,
      markInput: studentMarks[s.id] || '',
      computedGrade: studentMarks[s.id] ? getZimsecGrade(parseInt(studentMarks[s.id]) || 0) : '—',
    }))
  }, [currentClassForMarks, studentMarks])

  const classAverage = useMemo(() => {
    const validMarks = Object.values(studentMarks)
      .map(v => parseInt(v))
      .filter(v => !isNaN(v) && v >= 0 && v <= 100)
    if (validMarks.length === 0) return 0
    return Math.round(validMarks.reduce((a, b) => a + b, 0) / validMarks.length)
  }, [studentMarks])

  const gradeDistribution = useMemo(() => {
    const dist: Record<string, number> = { 'A*': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'U': 0 }
    Object.values(studentMarks).forEach(v => {
      const mark = parseInt(v)
      if (!isNaN(mark) && mark >= 0 && mark <= 100) {
        dist[getZimsecGrade(mark)]++
      }
    })
    return Object.entries(dist).map(([grade, count]) => ({ grade, count }))
  }, [studentMarks])

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleMarkChange = useCallback((studentId: string, value: string) => {
    if (value === '' || (/^\d{0,3}$/.test(value) && parseInt(value) <= 100)) {
      setStudentMarks(prev => ({ ...prev, [studentId]: value }))
      setMarksSaved(false)
    }
  }, [])

  const handleSaveMarks = useCallback(() => {
    const validMarks = Object.values(studentMarks).filter(v => v !== '' && !isNaN(parseInt(v)))
    if (validMarks.length === 0) {
      toast.error('No marks entered', { description: 'Please enter at least one mark before saving.' })
      return
    }
    setMarksSaved(true)
    toast.success('Marks saved successfully!', {
      description: `${validMarks.length} marks saved for ${selectedGrade} ${selectedSubject} - ${selectedAssessment}. Class average: ${classAverage}%`,
    })
  }, [studentMarks, selectedGrade, selectedSubject, selectedAssessment, classAverage])

  const handleAssignmentMarkChange = useCallback((studentId: string, value: string) => {
    if (value === '' || (/^\d{0,3}$/.test(value) && parseInt(value) <= 100)) {
      setAssignmentMarks(prev => ({ ...prev, [studentId]: value }))
    }
  }, [])

  const handleSaveAssignmentMarks = useCallback(() => {
    const validMarks = Object.values(assignmentMarks).filter(v => v !== '' && !isNaN(parseInt(v)))
    if (validMarks.length === 0) {
      toast.error('No marks entered', { description: 'Please enter at least one mark.' })
      return
    }
    toast.success('Assignment marks saved!', {
      description: `${validMarks.length} marks graded successfully.`,
    })
    setGradeAssignOpen(null)
    setAssignmentMarks({})
  }, [assignmentMarks])

  const handleAttendanceChange = useCallback((studentId: string, status: string) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }))
  }, [])

  const handleSubmitAttendance = useCallback(() => {
    const markedCount = Object.keys(attendanceData).length
    if (!currentClassForAttendance) return
    if (markedCount === 0) {
      toast.error('No attendance marked', { description: 'Please mark attendance for at least one student.' })
      return
    }
    const presentCount = Object.values(attendanceData).filter(v => v === 'Present').length
    const absentCount = Object.values(attendanceData).filter(v => v === 'Absent').length
    const lateCount = Object.values(attendanceData).filter(v => v === 'Late').length
    const excusedCount = Object.values(attendanceData).filter(v => v === 'Excused').length
    toast.success('Attendance submitted!', {
      description: `${attendanceClass}: ${presentCount} Present, ${absentCount} Absent, ${lateCount} Late, ${excusedCount} Excused`,
    })
  }, [attendanceData, attendanceClass, currentClassForAttendance])

  // ─── Schedule Color Map ────────────────────────────────────────────────────
  const getSlotColor = (slot: ScheduleSlot) => {
    if (slot.isFree) return 'bg-gray-100 dark:bg-gray-800/50'
    if (slot.isSubstitute) return 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700'
    if (slot.subject === 'Mathematics') return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700'
    if (slot.subject === 'Physics') return 'bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-700'
    return 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-700'
  }

  const getSlotTextColor = (slot: ScheduleSlot) => {
    if (slot.isFree) return 'text-muted-foreground'
    if (slot.isSubstitute) return 'text-amber-700 dark:text-amber-300'
    if (slot.subject === 'Mathematics') return 'text-emerald-700 dark:text-emerald-300'
    if (slot.subject === 'Physics') return 'text-violet-700 dark:text-violet-300'
    return 'text-teal-700 dark:text-teal-300'
  }

  // ─── Assignment Status Helpers ─────────────────────────────────────────────
  const statusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'Grading': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      case 'Closed': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const alertTypeStyle = (type: string) => {
    switch (type) {
      case 'critical': return 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20'
      case 'warning': return 'border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20'
      case 'positive': return 'border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
      default: return 'border-l-4 border-l-gray-300 bg-gray-50'
    }
  }

  const alertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'positive': return <Star className="h-4 w-4 text-emerald-500" />
      default: return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Teacher Portal</h2>
            <p className="text-sm text-muted-foreground">Welcome back, {teacherName}</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">My Classes</TabsTrigger>
          <TabsTrigger value="marks">Marks Entry</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="attendance">Attendance & Schedule</TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════════
            OVERVIEW TAB
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-4">
          {/* Welcome Banner */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-6 text-white relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 right-20 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-white/30">
                    <AvatarFallback className="bg-white/20 text-white text-lg font-bold">{teacherInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-2xl font-bold">Mhoroi, {teacherName.split(' ').pop()}!</h3>
                    <p className="text-emerald-100 mt-1">{teacherSubject} • Class Teacher: {teacherClass}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-6">
                  <div className="bg-white/15 rounded-lg px-4 py-2">
                    <p className="text-xs text-emerald-100">Today</p>
                    <p className="text-lg font-bold">{new Date().toLocaleDateString('en-ZW', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className="bg-white/15 rounded-lg px-4 py-2">
                    <p className="text-xs text-emerald-100">Periods Today</p>
                    <p className="text-lg font-bold">{todaySchedule.filter(s => !s.subject.includes('Free')).length} of 6</p>
                  </div>
                  <div className="bg-white/15 rounded-lg px-4 py-2">
                    <p className="text-xs text-emerald-100">Pending Tasks</p>
                    <p className="text-lg font-bold">6</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">My Classes</p>
                    <p className="text-2xl font-bold">4</p>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">2 subjects</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Students Taught</p>
                    <p className="text-2xl font-bold">128</p>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-teal-600" />
                      <span className="text-xs font-medium text-teal-600">Across 4 classes</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <Users className="h-5 w-5 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assignments Pending</p>
                    <p className="text-2xl font-bold">6</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">4 active, 2 grading</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Class Performance</p>
                    <p className="text-2xl font-bold">72%</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">+3% from last term</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
                    <BarChart3 className="h-5 w-5 text-violet-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Schedule + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Today's Schedule */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  Today&apos;s Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {todaySchedule.map((slot) => (
                    <div key={slot.period} className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-all hover:shadow-sm',
                      slot.subject.includes('Free') ? 'bg-gray-50 dark:bg-gray-800/30' : 'bg-background hover:bg-muted/50'
                    )}>
                      <div className={cn('h-10 w-1.5 rounded-full', slot.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">P{slot.period}</span>
                          <span className="text-xs text-muted-foreground">{slot.time}</span>
                        </div>
                        <p className={cn('text-sm font-medium', slot.subject.includes('Free') ? 'text-muted-foreground italic' : '')}>
                          {slot.subject}
                        </p>
                      </div>
                      {!slot.subject.includes('Free') && (
                        <div className="text-right">
                          <p className="text-xs font-medium">{slot.class}</p>
                          <p className="text-[10px] text-muted-foreground">{slot.room}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: ClipboardCheck, label: 'Take Attendance', color: 'bg-emerald-50 text-emerald-600', action: () => setActiveTab('attendance') },
                    { icon: Edit3, label: 'Enter Marks', color: 'bg-teal-50 text-teal-600', action: () => setActiveTab('marks') },
                    { icon: Calendar, label: 'View Schedule', color: 'bg-violet-50 text-violet-600', action: () => setActiveTab('attendance') },
                    { icon: FileText, label: 'Assign Homework', color: 'bg-amber-50 text-amber-600', action: () => { setActiveTab('assignments'); setCreateAssignOpen(true) } },
                    { icon: MessageSquare, label: 'Message Parents', color: 'bg-rose-50 text-rose-600', action: () => toast.info('Opening parent messaging...') },
                    { icon: CalendarCheck, label: 'Request Leave', color: 'bg-cyan-50 text-cyan-600', action: () => toast.info('Leave request form opened') },
                  ].map((action, idx) => (
                    <button key={idx} onClick={action.action} className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-transparent hover:border-muted bg-muted/30 hover:bg-white group">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', action.color)}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{action.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Performance Alerts */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Student Performance Alerts
              </CardTitle>
              <CardDescription>Students requiring attention based on recent performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {performanceAlerts.map((alert) => (
                  <motion.div key={alert.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: alert.id * 0.05 }}>
                    <div className={cn('rounded-lg p-3', alertTypeStyle(alert.type))}>
                      <div className="flex items-start gap-2">
                        {alertIcon(alert.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{alert.student}</p>
                            <Badge variant="outline" className="text-[10px] shrink-0">{alert.class}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            MY CLASSES TAB
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="classes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((cls, idx) => (
              <motion.div key={cls.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                <Card className="border-0 shadow-md overflow-hidden">
                  {/* Class Header */}
                  <div className={cn(
                    'p-4 text-white',
                    cls.subject === 'Mathematics'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-violet-500 to-purple-500'
                  )}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold">{cls.name} {cls.subject}</h3>
                        <p className="text-sm opacity-90">{cls.studentCount} students</p>
                      </div>
                      <BookOpen className="h-8 w-8 opacity-40" />
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-4">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Avg Performance</p>
                        <p className={cn('text-lg font-bold', cls.avgPerformance >= 70 ? 'text-emerald-600' : 'text-amber-600')}>
                          {cls.avgPerformance}%
                        </p>
                        <Progress value={cls.avgPerformance} className="h-1.5 mt-1" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Attendance</p>
                        <p className={cn('text-lg font-bold', cls.attendanceRate >= 90 ? 'text-emerald-600' : 'text-amber-600')}>
                          {cls.attendanceRate}%
                        </p>
                        <Progress value={cls.attendanceRate} className="h-1.5 mt-1" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Grade Avg</p>
                        <p className={cn('text-lg font-bold', gradeTextColor(getZimsecGrade(cls.avgPerformance)))}>
                          {getZimsecGrade(cls.avgPerformance)}
                        </p>
                        <div className="h-1.5 mt-1" />
                      </div>
                    </div>

                    {/* Upcoming Assessments */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Upcoming Assessments</p>
                      <div className="space-y-1.5">
                        {cls.upcomingAssessments.map((a, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs bg-muted/50 rounded-md px-3 py-2">
                            <Calendar className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span>{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Grade Distribution Mini Chart */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Grade Distribution</p>
                      <div className="flex items-end gap-1 h-12">
                        {cls.gradeDistribution.map((g) => (
                          <div key={g.grade} className="flex-1 flex flex-col items-center gap-0.5">
                            <div
                              className={cn(
                                'w-full rounded-t-sm transition-all',
                                g.grade === 'A*' || g.grade === 'A' ? 'bg-emerald-400' :
                                g.grade === 'B' ? 'bg-teal-400' :
                                g.grade === 'C' ? 'bg-amber-400' :
                                g.grade === 'D' ? 'bg-orange-400' :
                                'bg-red-400'
                              )}
                              style={{ height: `${Math.max((g.count / cls.studentCount) * 100, 4)}%` }}
                            />
                            <span className="text-[8px] text-muted-foreground">{g.grade}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expand Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1"
                      onClick={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)}
                    >
                      {expandedClass === cls.id ? 'Hide Students' : 'View Students'}
                      {expandedClass === cls.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CardContent>

                  {/* Expanded Student List */}
                  <AnimatePresence>
                    {expandedClass === cls.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="border-t bg-muted/20 p-4">
                          <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Student</TableHead>
                                  <TableHead className="text-xs text-center">Avg Mark</TableHead>
                                  <TableHead className="text-xs text-center">Grade</TableHead>
                                  <TableHead className="text-xs text-center">Attendance</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {cls.students.map((student) => (
                                  <TableRow key={student.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7">
                                          <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700">{student.initials}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="text-xs font-medium">{student.name}</p>
                                          <p className="text-[10px] text-muted-foreground">{student.studentNumber}</p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center text-xs font-medium">{student.avgMark}%</TableCell>
                                    <TableCell className="text-center">
                                      <Badge className={cn('text-[10px]', gradeColor(student.grade))}>{student.grade}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center text-xs">{student.attendance}%</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button size="sm" className="gap-1" onClick={() => { setActiveTab('marks'); setSelectedGrade(cls.name); setSelectedSubject(cls.subject) }}>
                              <Edit3 className="h-3 w-3" /> Enter Marks for {cls.name}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            MARKS ENTRY TAB
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="marks" className="space-y-4">
          {/* Selectors Row */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Class</Label>
                  <Select value={selectedGrade} onValueChange={(v) => { setSelectedGrade(v); setStudentMarks({}); setMarksSaved(false) }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Form 3A">Form 3A</SelectItem>
                      <SelectItem value="Form 4A">Form 4A</SelectItem>
                      <SelectItem value="Form 5A">Form 5A</SelectItem>
                      <SelectItem value="Form 6A">Form 6A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {selectedGrade === 'Form 6A' ? (
                        <SelectItem value="Physics">Physics</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Shona">Shona</SelectItem>
                          <SelectItem value="Physics">Physics</SelectItem>
                          <SelectItem value="Chemistry">Chemistry</SelectItem>
                          <SelectItem value="Biology">Biology</SelectItem>
                          <SelectItem value="History">History</SelectItem>
                          <SelectItem value="Geography">Geography</SelectItem>
                          <SelectItem value="Accounts">Accounts</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Assessment Type</Label>
                  <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mid-Term">Mid-Term</SelectItem>
                      <SelectItem value="Test">Test</SelectItem>
                      <SelectItem value="Exam">Exam</SelectItem>
                      <SelectItem value="Assignment">Assignment</SelectItem>
                      <SelectItem value="Practical">Practical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Marks Entry Table + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Student Marks Table */}
            <Card className="border-0 shadow-md lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {selectedGrade} - {selectedSubject} ({selectedAssessment})
                    </CardTitle>
                    <CardDescription>Enter marks out of 100 • ZIMSEC grading applied automatically</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {marksSaved && (
                      <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Saved
                      </Badge>
                    )}
                    <Button size="sm" className="gap-1" onClick={handleSaveMarks}>
                      <Save className="h-3 w-3" /> Save Marks
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[480px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 text-xs">#</TableHead>
                        <TableHead className="text-xs">Student Name</TableHead>
                        <TableHead className="text-xs text-center w-24">Mark /100</TableHead>
                        <TableHead className="text-xs text-center w-20">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marksForCurrentClass.map((student, idx) => (
                        <TableRow key={student.id}>
                          <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700">{student.initials}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={student.markInput}
                              onChange={(e) => handleMarkChange(student.id, e.target.value)}
                              placeholder="—"
                              className="w-20 h-8 text-center text-sm mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {student.computedGrade !== '—' ? (
                              <Badge className={cn('text-xs', gradeColor(student.computedGrade))}>{student.computedGrade}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {/* Class Average */}
                {classAverage > 0 && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium">Class Average</span>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">{classAverage}%</span>
                      <Badge className={cn('text-sm', gradeColor(getZimsecGrade(classAverage)))}>
                        {getZimsecGrade(classAverage)}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Grade Distribution Chart */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Performance Distribution</CardTitle>
                <CardDescription>ZIMSEC grade breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {gradeDistribution.some(g => g.count > 0) ? (
                  <ChartContainer config={gradeDistChartConfig} className="h-[300px] w-full">
                    <BarChart data={gradeDistribution} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="grade" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                    Enter marks to see distribution
                  </div>
                )}

                {/* ZIMSEC Grading Scale */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">ZIMSEC Grading Scale</p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {[
                      { grade: 'A*', range: '90-100', color: 'text-emerald-600' },
                      { grade: 'A', range: '80-89', color: 'text-emerald-600' },
                      { grade: 'B', range: '70-79', color: 'text-teal-600' },
                      { grade: 'C', range: '60-69', color: 'text-amber-600' },
                      { grade: 'D', range: '50-59', color: 'text-orange-600' },
                      { grade: 'E', range: '40-49', color: 'text-red-500' },
                      { grade: 'U', range: '0-39', color: 'text-red-700' },
                    ].map((g) => (
                      <div key={g.grade} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1">
                        <span className={cn('font-semibold', g.color)}>{g.grade}</span>
                        <span className="text-muted-foreground">{g.range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            ASSIGNMENTS TAB
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="assignments" className="space-y-4">
          {/* Header with Create Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Assignment Management</h3>
              <p className="text-sm text-muted-foreground">8 assignments • 4 active, 2 grading, 2 closed</p>
            </div>
            <Button className="gap-1" onClick={() => setCreateAssignOpen(true)}>
              <Plus className="h-4 w-4" /> Create Assignment
            </Button>
          </div>

          {/* Assignment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teacherAssignments.map((assignment, idx) => (
              <motion.div key={assignment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate">{assignment.title}</h4>
                        <p className="text-xs text-muted-foreground">{assignment.subject} • {assignment.className}</p>
                      </div>
                      <Badge className={cn('text-[10px] shrink-0 ml-2', statusBadge(assignment.status))}>
                        {assignment.status}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Due: {new Date(assignment.dueDate).toLocaleDateString('en-ZW', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Max: {assignment.maxMarks}
                      </span>
                    </div>

                    {/* Submission Progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Submissions</span>
                        <span className="font-medium">{assignment.submitted}/{assignment.total}</span>
                      </div>
                      <Progress value={(assignment.submitted / assignment.total) * 100} className="h-2" />
                    </div>

                    {/* Average Score (if available) */}
                    {assignment.avgScore !== null && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Average Score</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{assignment.avgScore}%</span>
                          <Badge className={cn('text-[10px]', gradeColor(getZimsecGrade(assignment.avgScore)))}>
                            {getZimsecGrade(assignment.avgScore)}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Grading Progress (if grading) */}
                    {assignment.status === 'Grading' && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Grading Progress</span>
                        <span className="font-medium">{assignment.graded}/{assignment.submitted}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      {assignment.status === 'Active' && (
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          <Eye className="h-3 w-3" /> View Submissions
                        </Button>
                      )}
                      {assignment.status === 'Grading' && (
                        <Button size="sm" className="gap-1 text-xs" onClick={() => { setGradeAssignOpen(assignment.id); setAssignmentMarks({}) }}>
                          <Edit3 className="h-3 w-3" /> Grade Submissions
                        </Button>
                      )}
                      {assignment.status === 'Closed' && (
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          <Download className="h-3 w-3" /> Export Results
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Create Assignment Dialog */}
          <Dialog open={createAssignOpen} onOpenChange={setCreateAssignOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Assignment</DialogTitle>
                <DialogDescription>Set a new assignment for your class</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-xs font-medium">Title</Label>
                  <Input placeholder="e.g. Algebra Problem Set 5" className="mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium">Subject</Label>
                    <Select defaultValue="Mathematics">
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Class</Label>
                    <Select defaultValue="Form 4A">
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Form 3A">Form 3A</SelectItem>
                        <SelectItem value="Form 4A">Form 4A</SelectItem>
                        <SelectItem value="Form 5A">Form 5A</SelectItem>
                        <SelectItem value="Form 6A">Form 6A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium">Due Date</Label>
                    <Input type="date" className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Max Marks</Label>
                    <Input type="number" placeholder="100" className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium">Description</Label>
                  <Textarea placeholder="Describe the assignment requirements..." className="mt-1.5" rows={3} />
                </div>
                <div>
                  <Label className="text-xs font-medium">Attach File</Label>
                  <div className="mt-1.5 flex items-center justify-center border-2 border-dashed rounded-lg p-6 text-muted-foreground hover:border-emerald-300 hover:text-emerald-600 transition-colors cursor-pointer">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-xs">Click to upload or drag and drop</p>
                      <p className="text-[10px] text-muted-foreground">PDF, DOC, XLS (Max 10MB)</p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateAssignOpen(false)}>Cancel</Button>
                <Button onClick={() => { setCreateAssignOpen(false); toast.success('Assignment created successfully!') }}>
                  Create Assignment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Grade Submissions Dialog */}
          <Dialog open={!!gradeAssignOpen} onOpenChange={(open) => { if (!open) setGradeAssignOpen(null) }}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Grade Submissions</DialogTitle>
                <DialogDescription>
                  {teacherAssignments.find(a => a.id === gradeAssignOpen)?.title} — {teacherAssignments.find(a => a.id === gradeAssignOpen)?.className}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[50vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs text-center w-24">Mark /{teacherAssignments.find(a => a.id === gradeAssignOpen)?.maxMarks || 100}</TableHead>
                      <TableHead className="text-xs text-center w-20">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.find(c => c.name === teacherAssignments.find(a => a.id === gradeAssignOpen)?.className)?.students.map((student, idx) => (
                      <TableRow key={student.id}>
                        <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="text-sm">{student.name}</TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={assignmentMarks[student.id] || ''}
                            onChange={(e) => handleAssignmentMarkChange(student.id, e.target.value)}
                            placeholder="—"
                            className="w-20 h-8 text-center text-sm mx-auto"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {assignmentMarks[student.id] && parseInt(assignmentMarks[student.id]) >= 0 ? (
                            <Badge className={cn('text-xs', gradeColor(getZimsecGrade(parseInt(assignmentMarks[student.id]))))}>
                              {getZimsecGrade(parseInt(assignmentMarks[student.id]))}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGradeAssignOpen(null)}>Cancel</Button>
                <Button onClick={handleSaveAssignmentMarks} className="gap-1">
                  <Save className="h-3 w-3" /> Save Grades
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            RESOURCES TAB
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="resources" className="space-y-4">
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
              <h3 className="text-lg font-bold flex items-center gap-2"><FolderOpen className="h-5 w-5" /> Teaching Resources</h3>
              <p className="text-emerald-100 text-sm mt-1">Upload, share, and manage learning materials for your classes</p>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Total Resources</p>
                    <p className="text-2xl font-bold">24</p>
                    <span className="text-xs text-emerald-600">6 this month</span>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50"><FolderOpen className="h-5 w-5 text-emerald-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Total Downloads</p>
                    <p className="text-2xl font-bold">342</p>
                    <span className="text-xs text-teal-600">by students</span>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50"><Download className="h-5 w-5 text-teal-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Shared Classes</p>
                    <p className="text-2xl font-bold">4</p>
                    <span className="text-xs text-amber-600">all active classes</span>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50"><BookOpen className="h-5 w-5 text-amber-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Button */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['All', 'Mathematics', 'Physics'].map(s => (
                <Button key={s} variant="outline" size="sm" className={cn('text-xs', s === 'All' && 'bg-emerald-50 border-emerald-200 text-emerald-700')}>{s}</Button>
              ))}
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => toast.info('Upload dialog opening...')}>
              <Upload className="h-4 w-4" /> Upload Resource
            </Button>
          </div>

          {/* Resources List */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  { name: 'Quadratic Equations Chapter 7 Notes', subject: 'Mathematics', classes: ['Form 3A', 'Form 4A'], type: 'PDF', size: '2.4 MB', downloads: 89, date: 'Feb 15, 2026' },
                  { name: 'ZIMSEC 2024 Maths Paper 1', subject: 'Mathematics', classes: ['Form 4A'], type: 'PDF', size: '1.8 MB', downloads: 156, date: 'Feb 10, 2026' },
                  { name: 'Newton\'s Laws Video Series', subject: 'Physics', classes: ['Form 6A'], type: 'Video', size: '120 MB', downloads: 33, date: 'Feb 8, 2026' },
                  { name: 'Trigonometry Worksheet Set', subject: 'Mathematics', classes: ['Form 3A', 'Form 4A'], type: 'DOC', size: '0.5 MB', downloads: 67, date: 'Feb 5, 2026' },
                  { name: 'Calculus: Derivatives Notes', subject: 'Mathematics', classes: ['Form 5A'], type: 'PDF', size: '3.1 MB', downloads: 28, date: 'Feb 2, 2026' },
                  { name: 'Electromagnetism Problem Set', subject: 'Physics', classes: ['Form 6A'], type: 'PDF', size: '1.2 MB', downloads: 22, date: 'Jan 28, 2026' },
                  { name: 'Algebra Revision Pack', subject: 'Mathematics', classes: ['Form 3A', 'Form 4A', 'Form 5A'], type: 'PDF', size: '4.5 MB', downloads: 134, date: 'Jan 20, 2026' },
                  { name: 'Mechanics Practical Guide', subject: 'Physics', classes: ['Form 6A'], type: 'PDF', size: '2.8 MB', downloads: 19, date: 'Jan 15, 2026' },
                ].map((resource, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                      resource.type === 'PDF' ? 'bg-red-100' : resource.type === 'DOC' ? 'bg-blue-100' : 'bg-purple-100'
                    )}>
                      <FileText className={cn('h-5 w-5', resource.type === 'PDF' ? 'text-red-600' : resource.type === 'DOC' ? 'text-blue-600' : 'text-purple-600')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resource.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px]">{resource.subject}</Badge>
                        <Badge variant="outline" className="text-[9px]">{resource.type}</Badge>
                        <span className="text-[10px] text-muted-foreground">{resource.size}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">{resource.downloads} downloads</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {resource.classes.map(c => (
                          <Badge key={c} variant="secondary" className="text-[8px] px-1.5 py-0">{c}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{resource.date}</span>
                      <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => toast.info(`Editing ${resource.name}`)}>
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs gap-1 text-red-500 hover:text-red-700" onClick={() => toast.success(`Resource deleted`)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            ATTENDANCE & SCHEDULE TAB
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="attendance" className="space-y-4">
          {/* Take Attendance Section */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    Take Attendance
                  </CardTitle>
                  <CardDescription>Mark student attendance for today&apos;s class</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={attendanceClass} onValueChange={(v) => { setAttendanceClass(v); setAttendanceData({}) }}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Form 3A">Form 3A</SelectItem>
                      <SelectItem value="Form 4A">Form 4A</SelectItem>
                      <SelectItem value="Form 5A">Form 5A</SelectItem>
                      <SelectItem value="Form 6A">Form 6A</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="gap-1" onClick={handleSubmitAttendance}>
                    <Save className="h-3 w-3" /> Submit Attendance
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Attendance Summary */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Present', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50', count: Object.values(attendanceData).filter(v => v === 'Present').length },
                  { label: 'Absent', icon: UserX, color: 'text-red-600 bg-red-50', count: Object.values(attendanceData).filter(v => v === 'Absent').length },
                  { label: 'Late', icon: Timer, color: 'text-amber-600 bg-amber-50', count: Object.values(attendanceData).filter(v => v === 'Late').length },
                  { label: 'Excused', icon: Smile, color: 'text-teal-600 bg-teal-50', count: Object.values(attendanceData).filter(v => v === 'Excused').length },
                ].map((s) => (
                  <div key={s.label} className={cn('rounded-lg p-3 flex items-center gap-3', s.color)}>
                    <s.icon className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium opacity-70">{s.label}</p>
                      <p className="text-lg font-bold">{s.count}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Student Attendance List */}
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-1">
                  {currentClassForAttendance?.students.map((student, idx) => (
                    <div key={student.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-xs text-muted-foreground w-6">{idx + 1}</span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700">{student.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{student.name}</p>
                        <p className="text-[10px] text-muted-foreground">{student.studentNumber}</p>
                      </div>
                      <RadioGroup
                        value={attendanceData[student.id] || ''}
                        onValueChange={(value) => handleAttendanceChange(student.id, value)}
                        className="flex items-center gap-2"
                      >
                        {[
                          { value: 'Present', label: 'P', color: 'text-emerald-600 border-emerald-300' },
                          { value: 'Absent', label: 'A', color: 'text-red-600 border-red-300' },
                          { value: 'Late', label: 'L', color: 'text-amber-600 border-amber-300' },
                          { value: 'Excused', label: 'E', color: 'text-teal-600 border-teal-300' },
                        ].map((option) => (
                          <div key={option.value} className="flex items-center gap-1">
                            <RadioGroupItem
                              value={option.value}
                              id={`${student.id}-${option.value}`}
                              className={cn('h-4 w-4', option.color)}
                            />
                            <Label htmlFor={`${student.id}-${option.value}`} className={cn('text-[10px] font-semibold cursor-pointer', option.color.split(' ')[0])}>
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Weekly Schedule Grid */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    Weekly Schedule
                  </CardTitle>
                  <CardDescription>Mr. Tendai Hove — Mathematics & Physics</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-emerald-200 dark:bg-emerald-800" /> Mathematics
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-violet-200 dark:bg-violet-800" /> Physics
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-amber-200 dark:bg-amber-800" /> Substitute
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-gray-200 dark:bg-gray-700" /> Free
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-1 mb-1">
                    <div className="text-xs font-medium text-muted-foreground p-2 text-center">Period</div>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                      <div key={day} className="text-xs font-medium text-muted-foreground p-2 text-center">{day}</div>
                    ))}
                  </div>

                  {/* Schedule Grid */}
                  {Array.from({ length: 8 }, (_, i) => i + 1).map(period => (
                    <div key={period} className="grid grid-cols-[80px_repeat(5,1fr)] gap-1 mb-1">
                      {/* Period Label */}
                      <div className="p-2 text-center">
                        <p className="text-xs font-semibold">P{period}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {['7:30', '8:20', '9:10', '10:10', '11:00', '11:50', '12:40', '1:30'][period - 1]}
                        </p>
                      </div>

                      {/* Day Cells */}
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                        const slot = weeklySchedule[day]?.[period]
                        if (!slot) return <div key={day} className="p-2 rounded bg-muted/30" />

                        return (
                          <div
                            key={day}
                            className={cn(
                              'p-2 rounded border transition-all hover:shadow-sm min-h-[60px]',
                              getSlotColor(slot),
                              slot.isFree ? 'border-transparent' : 'border'
                            )}
                          >
                            {slot.isFree ? (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-xs text-muted-foreground italic">Free</span>
                              </div>
                            ) : (
                              <div className={getSlotTextColor(slot)}>
                                <p className="text-xs font-semibold">{slot.subject}</p>
                                <p className="text-[10px] opacity-80">{slot.class}</p>
                                <p className="text-[10px] opacity-60">{slot.room}</p>
                                {slot.isSubstitute && (
                                  <div className="mt-1 flex items-center gap-0.5">
                                    <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />
                                    <span className="text-[9px] text-amber-600 dark:text-amber-400">Sub for {slot.originalTeacher}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Workload Summary */}
              <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Periods/Week', value: '20', icon: Clock, color: 'text-emerald-600' },
                  { label: 'Classes', value: '4', icon: Users, color: 'text-teal-600' },
                  { label: 'Subjects', value: '2', icon: BookOpen, color: 'text-violet-600' },
                  { label: 'Free Periods', value: '20', icon: Smile, color: 'text-amber-600' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                    <item.icon className={cn('h-5 w-5', item.color)} />
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-bold">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
