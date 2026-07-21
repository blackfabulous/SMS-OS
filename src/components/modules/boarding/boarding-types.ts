import type { ChartConfig } from '@/components/ui/chart'

export type ViewMode = 'list' | 'assign-boarder' | 'detail' | 'settings'

export interface Dormitory {
  id: string
  name: string
  capacity: number
  currentOccupancy: number
  boardingAssignments: Array<{
    id: string
    bedNumber: string | null
    status: string
    student: {
      id: string
      firstName: string
      lastName: string
      studentNumber: string
      gender: string
    }
  }>
}

export interface Hostel {
  id: string
  name: string
  gender: string | null
  capacity: number
  isActive: boolean
  dormitories: Dormitory[]
}

export interface BoardingAssignment {
  id: string
  bedNumber: string | null
  startDate: string
  status: string
  student: {
    id: string
    firstName: string
    lastName: string
    studentNumber: string
    gender: string
  }
  dormitory: {
    id: string
    name: string
    hostel: {
      id: string
      name: string
      gender: string | null
    }
  }
}

export interface BoardingData {
  hostels: Hostel[]
  stats: {
    totalBoarders: number
    totalHostels: number
    totalDormitories: number
    totalCapacity: number
    totalOccupancy: number
    occupancyRate: string
  }
  assignments: BoardingAssignment[]
}

export interface BoardingStudent {
  id: string
  firstName: string
  lastName: string
  studentNumber: string
}

export interface StudentsResponse {
  data: BoardingStudent[]
  total: number
  page: number
  totalPages: number
}

export interface BoardingSettings {
  defaultGender: string
  curfewTime: string
  checkInStartTime: string
  checkInEndTime: string
  visitorAllowed: boolean
  visitorHours: string
  autoAllocate: boolean
  notifyOnCheckIn: boolean
  notifyOnOverstay: boolean
  showBedNumbers: boolean
}

export const occupancyChartConfig = {
  occupancy: { label: 'Occupancy', color: '#10b981' },
  capacity: { label: 'Capacity', color: '#d1d5db' },
} satisfies ChartConfig
