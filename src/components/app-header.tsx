'use client'

import React from 'react'
import { Bell, Sun, Moon, DollarSign, Shield, BellRing, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { type UserRole, getRoleDisplayName, getRoleColor } from '@/lib/rbac'
import { cn } from '@/lib/utils'
import { GlobalSearch } from '@/components/global-search'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  SidebarInset, SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface Notification {
  id: string
  icon: React.ElementType
  title: string
  description: string
  time: string
  read: boolean
  type: 'enrollment' | 'payment' | 'attendance' | 'exam' | 'meeting' | 'deadline' | 'alert' | 'system'
}

const notificationTypeColors: Record<string, string> = {
  enrollment: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
  payment: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
  attendance: 'text-red-600 bg-red-50 dark:bg-red-950/30',
  exam: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30',
  meeting: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30',
  deadline: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
  alert: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30',
  system: 'text-slate-600 bg-slate-50 dark:bg-slate-900/30',
}

export function AppHeader({
  onLogout,
  notifications,
  onMarkAllRead,
  onMarkRead,
  userName,
  userInitials,
  exchangeRate,
  currentRole,
  unreadCount,
}: {
  onLogout: () => void
  notifications: Notification[]
  onMarkAllRead: () => void
  onMarkRead: (id: string) => void
  userName: string
  userInitials: string
  exchangeRate: number
  currentRole: UserRole
  unreadCount: number
}) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex h-12 md:h-14 items-center gap-1.5 sm:gap-2 md:gap-3 border-b bg-background/80 backdrop-blur-xl px-2 sm:px-3 md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
        {/* Exchange Rate Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[10px] font-medium text-amber-700 dark:text-amber-400">
          <DollarSign className="h-3 w-3" />
          <span>1 USD = {exchangeRate.toFixed(1)} ZiG</span>
        </div>

        {/* Role Badge */}
        <div className={cn('hidden md:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border', getRoleColor(currentRole))}>
          <Shield className="h-3 w-3" />
          <span>{getRoleDisplayName(currentRole)}</span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 relative min-w-[44px] min-h-[44px]">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-background">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-0" align="end" sideOffset={8}>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-semibold">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-700 px-1">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={onMarkAllRead} className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                  Mark all as read
                </button>
              )}
            </div>
            <ScrollArea className="h-80">
              <div className="divide-y">
                {notifications.map((notif) => {
                  const IconComp = notif.icon
                  return (
                    <button
                      key={notif.id}
                      onClick={() => onMarkRead(notif.id)}
                      className={cn(
                        'w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-muted/50',
                        !notif.read && 'bg-emerald-50/30 dark:bg-emerald-950/20'
                      )}
                    >
                      <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', notificationTypeColors[notif.type])}>
                        <IconComp className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs leading-snug', !notif.read && 'font-semibold')}>{notif.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{notif.description}</p>
                        <p className="text-[9px] text-muted-foreground/60 mt-1">{notif.time}</p>
                      </div>
                      {!notif.read && (
                        <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:h-10 sm:w-10 min-w-[44px] min-h-[44px]"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2 min-h-[44px]">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
                {userInitials}
              </div>
              <span className="hidden md:inline text-sm font-medium">{userName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">{getRoleDisplayName(currentRole)}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
