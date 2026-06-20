import { create } from 'zustand'
import { type UserRole } from '@/lib/rbac'

interface AppState {
  activeModule: string
  sidebarOpen: boolean
  schoolName: string
  searchQuery: string
  currentRole: UserRole | null
  setActiveModule: (module: string) => void
  toggleSidebar: () => void
  setSearchQuery: (query: string) => void
  setCurrentRole: (role: UserRole) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'dashboard',
  sidebarOpen: true,
  schoolName: 'Mufakose High School',
  searchQuery: '',
  currentRole: null,
  setActiveModule: (module) => set({ activeModule: module }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCurrentRole: (role) => set({ currentRole: role }),
}))
