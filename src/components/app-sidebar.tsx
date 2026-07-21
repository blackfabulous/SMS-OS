'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  School, Shield, Settings, LogOut, User, ChevronRight, ChevronDown,
  Sparkles, Search, X,
} from 'lucide-react'
import { type UserRole } from '@/lib/rbac'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarRail, useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type NavGroup = {
  label: string
  items: Array<{ id: string; label: string; icon: React.ElementType }>
}

export function AppSidebar({
  onLogout,
  notificationCount,
  userName,
  userRole,
  userInitials,
  currentRole,
  onRoleChange,
  filteredNavGroups,
  activeModule,
  onSelect,
}: {
  onLogout: () => void
  notificationCount: number
  userName: string
  userRole: string
  userInitials: string
  currentRole: UserRole
  onRoleChange: (role: UserRole) => void
  filteredNavGroups: NavGroup[]
  activeModule: string
  onSelect: (moduleId: string) => void
}) {
  const { state, isMobile, setOpenMobile } = useSidebar()
  const iconMode = state === 'collapsed' && !isMobile

  const [query, setQuery] = React.useState('')
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({})
  const searching = query.trim().length > 0

  // Apply the live search filter on top of the RBAC-filtered groups.
  const groups = React.useMemo(() => {
    if (!searching) return filteredNavGroups
    const q = query.trim().toLowerCase()
    return filteredNavGroups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0)
  }, [filteredNavGroups, query, searching])

  const handleSelect = (id: string) => {
    onSelect(id)
    if (isMobile) setOpenMobile(false)
  }

  const toggleGroup = (label: string) =>
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }))

  return (
    <Sidebar collapsible="icon" className="border-r-0 sidebar-watermark bg-gradient-to-b from-sidebar via-sidebar to-emerald-50/40 dark:to-emerald-950/20">
      {/* ─── Brand ─────────────────────────────────────────────────────────── */}
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20 relative overflow-hidden"
          >
            <School className="h-5 w-5 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
          </motion.div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">ZimSchool Pro</span>
              {notificationCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {notificationCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-emerald-500" />
              <span className="text-[10px] text-muted-foreground leading-tight">Management System</span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <div className="sidebar-divider" />

      <SidebarContent className="px-2 py-2 sidebar-scroll">
        {/* ─── Role selector ───────────────────────────────────────────────── */}
        {!iconMode && (
          <div className="px-2 pb-1.5">
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/40 p-2 transition-colors hover:border-emerald-300/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20">
              <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <Select value={currentRole} onValueChange={(v) => onRoleChange(v as UserRole)}>
                <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-[11px] font-medium focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="BURSAR">Bursar</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* ─── Nav search/filter ───────────────────────────────────────────── */}
        {!iconMode && (
          <div className="px-2 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to…"
                className="h-8 w-full rounded-lg border border-border/50 bg-muted/40 pl-8 pr-7 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-emerald-400/60 focus:bg-background focus:ring-1 focus:ring-emerald-500/30"
              />
              {searching && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {groups.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">No modules match “{query}”.</p>
        )}

        {groups.map((group) => {
          const isOpen = iconMode || searching || !collapsed[group.label]
          return (
            <SidebarGroup key={group.label} className="py-0.5">
              {/* Collapsible group header (hidden in icon mode) */}
              {!iconMode && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 transition-colors hover:text-emerald-600"
                >
                  <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', !isOpen && '-rotate-90')} />
                  <span className="flex-1 text-left">{group.label}</span>
                  <span className="rounded bg-muted/60 px-1 text-[9px] font-medium text-muted-foreground/70">{group.items.length}</span>
                </button>
              )}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={iconMode ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item) => {
                          const isActive = activeModule === item.id
                          return (
                            <SidebarMenuItem key={item.id}>
                              <SidebarMenuButton
                                isActive={isActive}
                                onClick={() => handleSelect(item.id)}
                                tooltip={item.label}
                                className={cn(
                                  'group relative overflow-hidden transition-all duration-200',
                                  isActive
                                    ? 'bg-emerald-50 font-semibold text-emerald-700 hover:bg-emerald-100/80 hover:text-emerald-800 [&>svg]:text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 dark:[&>svg]:text-emerald-400'
                                    : 'hover:bg-muted/60 hover:translate-x-0.5'
                                )}
                              >
                                <item.icon className={cn('transition-transform duration-200', isActive ? 'scale-110' : 'text-muted-foreground group-hover:scale-105 group-hover:text-emerald-500')} />
                                <span>{item.label}</span>
                                {isActive && (
                                  <motion.div
                                    layoutId="sidebar-active-indicator"
                                    className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-500"
                                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                  />
                                )}
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          )
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      {/* ─── User footer ───────────────────────────────────────────────────── */}
      <SidebarFooter className="p-3">
        <div className="sidebar-divider mb-3" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex w-full items-center gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-emerald-50/60 hover:ring-1 hover:ring-emerald-200/50 active:scale-[0.98] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 dark:hover:bg-emerald-950/30 dark:hover:ring-emerald-800/30">
              <div className="relative">
                <Avatar className="h-9 w-9 border-2 border-emerald-200 transition-all duration-300 group-hover:border-emerald-400 dark:border-emerald-800 dark:group-hover:border-emerald-600">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-semibold text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-sidebar" />
              </div>
              <div className="flex flex-1 flex-col items-start group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold">{userName}</span>
                <Badge variant="outline" className="h-4 px-1.5 py-0 text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                  {userRole}
                </Badge>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-500 group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-500">
                <span className="text-[10px] font-bold text-white">{userInitials}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-[10px] text-muted-foreground">{userRole}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer transition-colors focus:bg-emerald-50 dark:focus:bg-emerald-950/30"><User className="mr-2 h-4 w-4 text-muted-foreground" /> Profile</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer transition-colors focus:bg-emerald-50 dark:focus:bg-emerald-950/30"><Shield className="mr-2 h-4 w-4 text-muted-foreground" /> Security</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer transition-colors focus:bg-emerald-50 dark:focus:bg-emerald-950/30"><Settings className="mr-2 h-4 w-4 text-muted-foreground" /> Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600 transition-colors focus:bg-red-50 dark:focus:bg-red-950/30" onClick={onLogout}><LogOut className="mr-2 h-4 w-4" /> Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
