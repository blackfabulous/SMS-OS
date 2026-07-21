export interface SDCMember {
  id: string
  name: string
  position: string
  phone?: string
  email?: string
  termStart?: string
  termEnd?: string
  isActive: boolean
  createdAt: string
}

export interface SDCMeeting {
  id: string
  title: string
  description?: string
  eventType: string
  startDate: string
  endDate?: string
  venue?: string
}

export interface SDCProject {
  id: string
  title: string
  description?: string
  eventType: string
  startDate: string
  endDate?: string
  venue?: string
}

export interface SDCResponse {
  members: SDCMember[]
  meetings: SDCMeeting[]
  projects: SDCProject[]
  events: SDCMeeting[]
  stats: {
    totalMembers: number
    activeMembers: number
    meetingsThisTerm: number
    activeProjects: number
    fundBalance: number
    totalPayments: number
  }
  schoolInfo: {
    sdcChairperson: string | null
    sdcSecretary: string | null
    sdcTreasurer: string | null
  }
  pagination: {
    page: number
    limit: number
    totalMembers: number
    totalPages: number
  }
}

export type SDCViewMode = 'list' | 'add' | 'edit' | 'detail' | 'settings'

export interface SDCMemberForm {
  name: string
  position: string
  phone: string
  email: string
  termStart: string
  termEnd: string
}

export interface SDCMeetingForm {
  title: string
  description: string
  startDate: string
  endDate: string
  venue: string
}
