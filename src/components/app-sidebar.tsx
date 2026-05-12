'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  School, Shield, Settings, LogOut, User, ChevronRight,
  Sparkles, Moon, Sun,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { type UserRole } from '@/lib/rbac'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarInset, SidebarTrigger, SidebarRail,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
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
}: {
  onLogout: () => void
  notificationCount: number
  userName: string
  userRole: string
  userInitials: string
  currentRole: UserRole
  onRoleChange: (role: UserRole) => void
  filteredNavGroups: NavGroup[]
}) {
  const { activeModule, setActiveModule } = useAppStore()

  return (
    <Sidebar collapsible="icon" className="border-r-0 sidebar-watermark bg-gradient-to-b from-sidebar via-sidebar to-emerald-50/30 dark:to-emerald-950/20">
      <SidebarHeader className="p-3">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
        >
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30 transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-200/70 dark:hover:shadow-emerald-800/40 relative overflow-hidden"
          >
            <School className="h-5 w-5 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">ZimSchool Pro</span>
              {notificationCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white animate-pulse-glow"
                >
                  {notificationCount}
                </motion.span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-emerald-500" />
              <span className="text-[10px] text-muted-foreground leading-tight">Management System</span>
            </div>
          </div>
        </motion.div>
      </SidebarHeader>

      <div className="sidebar-divider" />

      <SidebarContent className="px-2 py-2 sidebar-scroll">
        {/* Role Selector Badge */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="px-2 pb-2"
        >
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/50 transition-all duration-200 hover:border-emerald-200/50 dark:hover:border-emerald-800/30 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20">
            <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <Select value={currentRole} onValueChange={(v) => onRoleChange(v as UserRole)}>
              <SelectTrigger className="h-6 text-[11px] border-0 p-0 bg-transparent focus:ring-0 focus:ring-offset-0 font-medium">
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
        </motion.div>
        {filteredNavGroups.map((group, groupIndex) => (
          <SidebarGroup key={group.label} className={cn("py-1", groupIndex > 0 && "mt-1")}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-2 flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-emerald-400/40" />
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item, itemIndex) => {
                  const isActive = activeModule === item.id
                  return (
                    <SidebarMenuItem key={item.id}>
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: groupIndex * 0.05 + itemIndex * 0.03 }}
                      >
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setActiveModule(item.id)}
                          tooltip={item.label}
                          className={cn(
                            'transition-all duration-200 group relative overflow-hidden',
                            isActive
                              ? 'bg-emerald-50/80 text-emerald-700 font-semibold hover:bg-emerald-100/80 hover:text-emerald-800 [&>svg]:text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200 dark:[&>svg]:text-emerald-400 shadow-sm shadow-emerald-100/50 dark:shadow-emerald-900/20'
                              : 'hover:bg-muted/60 hover:translate-x-0.5 hover:shadow-sm hover:shadow-muted/50'
                          )}
                        >
                          <item.icon className={cn(
                            'transition-all duration-200',
                            isActive ? 'text-emerald-600 scale-110' : 'text-muted-foreground group-hover:text-emerald-500 group-hover:scale-105'
                          )} />
                          <span>{item.label}</span>
                          {/* Active indicator bar */}
                          <AnimatePresence mode="wait">
                            {isActive && (
                              <motion.div
                                layoutId="sidebar-active-indicator"
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-500 shadow-sm shadow-emerald-400/50"
                                initial={{ scaleY: 0, opacity: 0 }}
                                animate={{ scaleY: 1, opacity: 1 }}
                                exit={{ scaleY: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                              />
                            )}
                          </AnimatePresence>
                          {/* Hover shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                        </SidebarMenuButton>
                      </motion.div>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="sidebar-divider mb-3" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 hover:ring-1 hover:ring-emerald-200/50 dark:hover:ring-emerald-800/30 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group active:scale-[0.98]">
              <div className="relative">
                <Avatar className="h-9 w-9 border-2 border-emerald-200 dark:border-emerald-800 transition-all duration-300 group-hover:border-emerald-400 dark:group-hover:border-emerald-600 group-hover:shadow-md group-hover:shadow-emerald-200/30 dark:group-hover:shadow-emerald-900/30">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {/* Online status dot */}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-sidebar shadow-sm shadow-emerald-500/50 animate-pulse-glow" />
              </div>
              <div className="flex flex-1 flex-col items-start group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold">{userName}</span>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                    {userRole}
                  </Badge>
                </div>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-emerald-500 transition-all duration-200 group-hover:translate-x-0.5 group-data-[collapsible=icon]:hidden" />
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
            <DropdownMenuItem className="text-red-600 cursor-pointer transition-colors focus:bg-red-50 dark:focus:bg-red-950/30" onClick={onLogout}><LogOut className="mr-2 h-4 w-4" /> Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
