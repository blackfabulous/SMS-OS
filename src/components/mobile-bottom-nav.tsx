'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, GraduationCap, DollarSign, CalendarCheck,
  MoreHorizontal, Users, UserPlus, BookOpen, FileCheck,
  Banknote, BedDouble, Bus, Library, Package, Heart,
  Scale, HeartPulse, Building, MessageSquare, Settings,
  Clock, Trophy, Coffee, ShoppingCart, Shield, Monitor,
  Calculator, FileText, UsersRound, BellRing, School,
  ClipboardCheck, ArrowRightLeft, X, ChevronDown, ChevronUp,
  Home, ShoppingBag, Globe, Palette, Printer,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MobileBottomNavProps {
  activeModule: string
  onModuleChange: (moduleId: string) => void
  notificationCount?: number
}

// Quick access nav items (5 items shown in bottom bar)
const quickNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
]

// All module categories for the "More" sheet
const allCategories = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'students', label: 'Students', icon: GraduationCap },
      { id: 'staff', label: 'Staff', icon: Users },
      { id: 'admissions', label: 'Admissions', icon: UserPlus },
      { id: 'parent-portal', label: 'Parent Portal', icon: UsersRound },
      { id: 'student-portal', label: 'Student Portal', icon: GraduationCap },
      { id: 'teacher-portal', label: 'Teacher Portal', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Academics',
    items: [
      { id: 'academics', label: 'Academics', icon: BookOpen },
      { id: 'timetable', label: 'Timetable', icon: Clock },
      { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
      { id: 'examinations', label: 'Examinations', icon: FileCheck },
      { id: 'zimsec-import', label: 'ZIMSEC Import', icon: FileCheck },
      { id: 'elearning', label: 'E-Learning', icon: Monitor },
      { id: 'reports', label: 'Reports', icon: FileText },
      { id: 'bulk-operations', label: 'Bulk Ops', icon: ArrowRightLeft },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'finance', label: 'Finance', icon: DollarSign },
      { id: 'fee-calculator', label: 'Fee Calc', icon: Calculator },
      { id: 'payroll', label: 'Payroll', icon: Banknote },
      { id: 'procurement', label: 'Procurement', icon: ShoppingCart },
      { id: 'premium-templates', label: 'Templates', icon: Printer },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'boarding', label: 'Boarding', icon: BedDouble },
      { id: 'transport', label: 'Transport', icon: Bus },
      { id: 'library', label: 'Library', icon: Library },
      { id: 'inventory', label: 'Inventory', icon: Package },
      { id: 'canteen', label: 'Canteen', icon: Coffee },
      { id: 'school-shop', label: 'Shop', icon: ShoppingBag },
    ],
  },
  {
    label: 'Welfare',
    items: [
      { id: 'welfare', label: 'Welfare', icon: Heart },
      { id: 'discipline', label: 'Discipline', icon: Scale },
      { id: 'health', label: 'Health', icon: HeartPulse },
    ],
  },
  {
    label: 'Community',
    items: [
      { id: 'alumni', label: 'Alumni', icon: UsersRound },
    ],
  },
  {
    label: 'Admin',
    items: [
      { id: 'sdc', label: 'SDC', icon: Building },
      { id: 'events', label: 'Events', icon: Trophy },
      { id: 'notification-center', label: 'Notifications', icon: BellRing },
      { id: 'communication', label: 'Communication', icon: MessageSquare },
      { id: 'documents', label: 'Documents', icon: FileText },
      { id: 'security', label: 'Security', icon: Shield },
      { id: 'website-cms', label: 'Website', icon: Globe },
      { id: 'admin-cms', label: 'Admin CMS', icon: Palette },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'setup-wizard', label: 'Setup', icon: School },
    ],
  },
]

export default function MobileBottomNav({ activeModule, onModuleChange, notificationCount = 0 }: MobileBottomNavProps) {
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Main')

  const handleModuleSelect = (moduleId: string) => {
    onModuleChange(moduleId)
    setMoreSheetOpen(false)
  }

  const toggleCategory = (label: string) => {
    setExpandedCategory(prev => prev === label ? null : label)
  }

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-inset-bottom">
        {/* Glass-morphism background */}
        <div className="relative">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-xl border-t border-border/50" />
          <div className="relative flex items-center justify-around px-1 sm:px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
            {quickNavItems.map((item) => {
              const isActive = activeModule === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleModuleSelect(item.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 px-2 rounded-xl transition-all duration-200 relative',
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-active"
                      className="absolute inset-0 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <div className="relative">
                    <item.icon className={cn(
                      'h-5 w-5 transition-transform duration-200',
                      isActive && 'scale-110'
                    )} />
                    {item.id === 'dashboard' && notificationCount > 0 && (
                      <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white ring-1 ring-background">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium transition-all duration-200',
                    isActive ? 'font-semibold' : 'opacity-70'
                  )}>
                    {item.label}
                  </span>
                </button>
              )
            })}

            {/* More Button */}
            <button
              onClick={() => setMoreSheetOpen(true)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 px-2 rounded-xl transition-all duration-200 relative',
                !quickNavItems.some(i => i.id === activeModule) && activeModule !== 'dashboard'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {!quickNavItems.some(i => i.id === activeModule) && activeModule !== 'dashboard' && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute inset-0 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <div className="relative">
                <MoreHorizontal className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  moreSheetOpen && 'rotate-90 scale-110'
                )} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white ring-1 ring-background">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-all duration-200',
                !quickNavItems.some(i => i.id === activeModule) && activeModule !== 'dashboard' ? 'font-semibold' : 'opacity-70'
              )}>
                More
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* More Sheet - Slide Up */}
      <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0 gap-0 border-t-2 border-emerald-200 dark:border-emerald-800">
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
          </div>

          <SheetHeader className="px-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Home className="h-4 w-4 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-base">All Modules</SheetTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{allCategories.reduce((acc, c) => acc + c.items.length, 0)} modules available</p>
                </div>
              </div>
              {notificationCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  {notificationCount} notifications
                </Badge>
              )}
            </div>
          </SheetHeader>

          <Separator className="opacity-50" />

          <ScrollArea className="flex-1 px-4 py-2">
            <div className="space-y-1 pb-20">
              {allCategories.map((category) => {
                const isExpanded = expandedCategory === category.label
                const hasActiveItem = category.items.some(i => i.id === activeModule)

                return (
                  <div key={category.label} className="rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category.label)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200',
                        isExpanded
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/30'
                          : 'hover:bg-muted/50',
                        hasActiveItem && !isExpanded && 'bg-emerald-50/40 dark:bg-emerald-950/20'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
                        <span className={cn(
                          'text-xs font-semibold uppercase tracking-wider',
                          isExpanded ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                        )}>
                          {category.label}
                        </span>
                        {hasActiveItem && (
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-3 gap-1.5 px-1 py-2">
                            {category.items.map((item) => {
                              const isActive = activeModule === item.id
                              return (
                                <motion.button
                                  key={item.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.15 }}
                                  onClick={() => handleModuleSelect(item.id)}
                                  className={cn(
                                    'flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl transition-all duration-200 min-h-[68px]',
                                    isActive
                                      ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-1 ring-emerald-300 dark:ring-emerald-700 shadow-sm'
                                      : 'hover:bg-muted/60 active:scale-95'
                                  )}
                                >
                                  <div className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                                    isActive
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-muted text-muted-foreground'
                                  )}>
                                    <item.icon className="h-4 w-4" />
                                  </div>
                                  <span className={cn(
                                    'text-[10px] leading-tight text-center font-medium line-clamp-2',
                                    isActive
                                      ? 'text-emerald-700 dark:text-emerald-300'
                                      : 'text-muted-foreground'
                                  )}>
                                    {item.label}
                                  </span>
                                </motion.button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
