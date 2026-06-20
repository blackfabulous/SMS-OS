'use client'

/**
 * Shared module-UI kit — the single source of truth for the layout primitives
 * every feature module uses: stat cards, section headers/cards, toolbars, and a
 * table shell. Built on the base shadcn primitives so the look stays consistent
 * across all 41 modules. Bolder restyle: emerald brand accents, denser data,
 * cleaner surfaces, responsive by default.
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList } from '@/components/ui/tabs'

// ─── ModuleContainer ──────────────────────────────────────────────────────────
// Consistent vertical rhythm + entrance animation wrapper for a module's body.
export function ModuleContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn('space-y-4 sm:space-y-5', className)}
    >
      {children}
    </motion.div>
  )
}

// ─── StatGrid ───────────────────────────────────────────────────────────────
// Responsive grid for stat cards. Defaults flow 2 → 3 → 4/5 across breakpoints.
export function StatGrid({
  children,
  className,
  cols = 4,
}: {
  children: React.ReactNode
  className?: string
  cols?: 3 | 4 | 5 | 6
}) {
  const colClass: Record<number, string> = {
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }
  return (
    <div className={cn('grid gap-3', colClass[cols], className)}>{children}</div>
  )
}

// ─── ModuleStatCard ───────────────────────────────────────────────────────────
// Canonical stat card. Prop shape is drop-in compatible with the legacy per-module
// definitions (icon, label, value, accentGradient, bgColor) plus optional extras.
export function ModuleStatCard({
  icon: Icon,
  label,
  value,
  accentGradient = 'from-emerald-400 to-teal-500',
  bgColor = 'bg-emerald-50 dark:bg-emerald-950/40',
  iconColor,
  hint,
  trend,
  footer,
  index = 0,
  className,
  valueClassName,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  accentGradient?: string
  bgColor?: string
  iconColor?: string
  hint?: string
  trend?: { value: string; positive?: boolean }
  footer?: React.ReactNode
  index?: number
  className?: string
  valueClassName?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Card
        className={cn(
          'relative gap-0 overflow-hidden border-border/60 py-0 shadow-sm hover:shadow-md transition-shadow duration-200',
          className
        )}
      >
        <span className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', accentGradient)} />
        <CardContent className="flex items-center gap-3 p-3 sm:p-4">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11',
              bgColor
            )}
          >
            <Icon className={cn('h-5 w-5', iconColor || 'text-emerald-600 dark:text-emerald-400')} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
              {label}
            </p>
            <div className="flex items-baseline gap-1.5">
              <p className={cn('text-xl font-bold tracking-tight sm:text-2xl', valueClassName)}>{value}</p>
              {trend && (
                <span
                  className={cn(
                    'text-[10px] font-semibold',
                    trend.positive === false ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {trend.value}
                </span>
              )}
            </div>
            {hint && <p className="truncate text-[10px] text-muted-foreground/70">{hint}</p>}
            {footer && <div className="mt-0.5">{footer}</div>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── SectionHeader ──────────────────────────────────────────────────────────
// Consistent section title block (used inside cards or standalone).
export function SectionHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ElementType
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex items-start gap-2.5 min-w-0">
        {Icon && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h3>
          {description && <p className="text-xs text-muted-foreground sm:text-sm">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

// ─── SectionCard ──────────────────────────────────────────────────────────────
// Card with a standardized header (title/description/actions) and content area.
export function SectionCard({
  title,
  description,
  icon,
  actions,
  children,
  className,
  contentClassName,
  noPadding,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ElementType
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  noPadding?: boolean
}) {
  return (
    <Card className={cn('gap-0 overflow-hidden py-0', className)}>
      {(title || actions) && (
        <div className="border-b border-border/60 px-4 py-3.5 sm:px-5">
          <SectionHeader title={title} description={description} icon={icon} actions={actions} />
        </div>
      )}
      <div className={cn(noPadding ? '' : 'p-4 sm:p-5', contentClassName)}>{children}</div>
    </Card>
  )
}

// ─── ModuleToolbar ──────────────────────────────────────────────────────────
// Responsive search + filters + actions row. Search is optional.
export function ModuleToolbar({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  filters,
  actions,
  className,
}: {
  search?: string
  onSearch?: (v: string) => void
  searchPlaceholder?: string
  filters?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between', className)}>
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        {onSearch && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 border-border/70 bg-muted/30 pl-9 focus-visible:ring-1 focus-visible:ring-emerald-500/40"
            />
          </div>
        )}
        {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

// ─── TableShell ─────────────────────────────────────────────────────────────
// Bordered, rounded, horizontally-scrollable container for a Table, with an
// optional sticky header and an empty-state fallback. Wrap <Table> children.
export function TableShell({
  children,
  isEmpty,
  empty,
  stickyHeader,
  maxHeight,
  className,
}: {
  children: React.ReactNode
  isEmpty?: boolean
  empty?: React.ReactNode
  stickyHeader?: boolean
  maxHeight?: string
  className?: string
}) {
  if (isEmpty && empty) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
        {empty}
      </div>
    )
  }
  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-xl border border-border/60',
        stickyHeader && 'table-sticky-head',
        className
      )}
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
    >
      {children}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function KitEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── ModulePageLayout ────────────────────────────────────────────────────────
// Canonical page layout for every module's main view. Enforces a single
// consistent pattern: tabs on the LEFT, action buttons on the RIGHT.
// All modules MUST use this instead of hand-rolling their own tab + actions rows.
export function ModulePageLayout({
  tabs,
  activeTab,
  onTabChange,
  actions,
  children,
  className,
}: {
  tabs: React.ReactNode
  activeTab: string
  onTabChange: (value: string) => void
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="bg-muted/50 p-1 h-10 overflow-x-auto no-scrollbar shrink-0">
          {tabs}
        </TabsList>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>
      {children}
    </Tabs>
  )
}

// ─── ModuleSettingsButton ────────────────────────────────────────────────────
// Standardized settings button for every module. Always appears at the end
// of the actions row. Consistent size, icon, and label across all modules.
export function ModuleSettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="h-9 gap-1.5 border-border/70">
      <Settings className="h-4 w-4" />
      <span className="hidden sm:inline">Settings</span>
    </Button>
  )
}
