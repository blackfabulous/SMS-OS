import { create } from 'zustand'

interface AppState {
  activeModule: string
  sidebarOpen: boolean
  schoolName: string
  searchQuery: string
  setActiveModule: (module: string) => void
  toggleSidebar: () => void
  setSearchQuery: (query: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'dashboard',
  sidebarOpen: true,
  schoolName: 'Mufakose High School',
  searchQuery: '',
  setActiveModule: (module) => set({ activeModule: module }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
