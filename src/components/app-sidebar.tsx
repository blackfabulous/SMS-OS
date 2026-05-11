'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  School, Shield, Settings, LogOut, User, ChevronRight,
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
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30 transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-200/70 dark:hover:shadow-emerald-800/40">
            <School className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight">ZimSchool Pro</span>
              {notificationCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {notificationCount}
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground leading-tight">Management System</span>
          </div>
        </div>
      </SidebarHeader>

      <div className="sidebar-divider" />

      <SidebarContent className="px-2 py-2 sidebar-scroll">
        {/* Role Selector Badge */}
        <div className="px-2 pb-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/50">
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
        </div>
        {filteredNavGroups.map((group, groupIndex) => (
          <SidebarGroup key={group.label} className={cn("py-1", groupIndex > 0 && "mt-1")}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-2 flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-emerald-400/40" />
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = activeModule === item.id
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setActiveModule(item.id)}
                        tooltip={item.label}
                        className={cn(
                          'transition-all duration-200 group relative hover-ripple',
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 hover:text-emerald-800 [&>svg]:text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200 dark:[&>svg]:text-emerald-400'
                            : 'hover:bg-muted/60 hover:translate-x-0.5'
                        )}
                      >
                        <item.icon className={cn(
                          'transition-all duration-200',
                          isActive ? 'text-emerald-600' : 'text-muted-foreground group-hover:text-emerald-500'
                        )} />
                        <span>{item.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-emerald-400 to-teal-500"
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Separator className="mb-3 opacity-60" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 transition-all duration-200 hover:bg-muted/60 hover:ring-1 hover:ring-emerald-200/50 dark:hover:ring-emerald-800/30 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group">
              <Avatar className="h-8 w-8 border-2 border-emerald-200 dark:border-emerald-800 transition-colors group-hover:border-emerald-400 dark:group-hover:border-emerald-600">
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-[10px] text-muted-foreground">{userRole}</span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-emerald-500 transition-colors group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
            <DropdownMenuItem><Shield className="mr-2 h-4 w-4" /> Security</DropdownMenuItem>
            <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={onLogout}><LogOut className="mr-2 h-4 w-4" /> Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
