'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ModuleSkeletonProps {
  /** Number of stat cards to show (default 4) */
  statCount?: number
  /** Show a chart placeholder below stats */
  showChart?: boolean
  /** Show a table placeholder below stats */
  showTable?: boolean
  /** Number of table rows (default 6) */
  tableRows?: number
  /** Number of table columns (default 5) */
  tableCols?: number
  className?: string
}

export function ModuleSkeleton({
  statCount = 4,
  showChart = true,
  showTable = true,
  tableRows = 6,
  tableCols = 5,
  className,
}: ModuleSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 bg-emerald-100/40 dark:bg-emerald-900/20" />
          <Skeleton className="h-4 w-40 bg-emerald-50/40 dark:bg-emerald-900/10" />
        </div>
        <Skeleton className="h-10 w-36 bg-emerald-100/40 dark:bg-emerald-900/20 rounded-lg" />
      </div>

      {/* Stat cards skeleton */}
      <div className={cn(
        'grid gap-4',
        statCount === 2 ? 'grid-cols-1 sm:grid-cols-2' :
        statCount === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      )}>
        {Array.from({ length: statCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border-0 shadow-md p-5 bg-card overflow-hidden relative"
          >
            {/* Top accent line */}
            <Skeleton className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-200/50 dark:bg-emerald-800/30" />
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <Skeleton className="h-3 w-20 bg-emerald-100/40 dark:bg-emerald-900/20" />
                <Skeleton className="h-7 w-24 bg-emerald-100/50 dark:bg-emerald-900/25" />
                <Skeleton className="h-3 w-28 bg-emerald-50/40 dark:bg-emerald-900/15" />
              </div>
              <Skeleton className="h-11 w-11 rounded-xl bg-emerald-100/40 dark:bg-emerald-900/20" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      {showChart && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl shadow-md p-5 bg-card">
            <div className="space-y-2 mb-4">
              <Skeleton className="h-5 w-32 bg-emerald-100/40 dark:bg-emerald-900/20" />
              <Skeleton className="h-3 w-48 bg-emerald-50/40 dark:bg-emerald-900/15" />
            </div>
            <Skeleton className="h-[220px] w-full bg-emerald-50/30 dark:bg-emerald-900/10 rounded-lg" />
          </div>
          <div className="rounded-xl shadow-md p-5 bg-card">
            <div className="space-y-2 mb-4">
              <Skeleton className="h-5 w-36 bg-emerald-100/40 dark:bg-emerald-900/20" />
              <Skeleton className="h-3 w-44 bg-emerald-50/40 dark:bg-emerald-900/15" />
            </div>
            <Skeleton className="h-[220px] w-full bg-emerald-50/30 dark:bg-emerald-900/10 rounded-lg" />
          </div>
        </div>
      )}

      {/* Table skeleton */}
      {showTable && (
        <div className="rounded-xl shadow-md bg-card overflow-hidden">
          <div className="p-5 border-b">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40 bg-emerald-100/40 dark:bg-emerald-900/20" />
                <Skeleton className="h-3 w-28 bg-emerald-50/40 dark:bg-emerald-900/15" />
              </div>
              <Skeleton className="h-9 w-48 bg-emerald-100/40 dark:bg-emerald-900/20 rounded-md" />
            </div>
          </div>
          <div className="p-0">
            {/* Table header */}
            <div className="flex items-center gap-4 px-5 py-3 bg-muted/30">
              {Array.from({ length: tableCols }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1 bg-emerald-100/30 dark:bg-emerald-900/15" />
              ))}
            </div>
            {/* Table rows */}
            {Array.from({ length: tableRows }).map((_, rowIdx) => (
              <div
                key={rowIdx}
                className={cn(
                  'flex items-center gap-4 px-5 py-3 border-t border-border/50',
                  rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                )}
              >
                {Array.from({ length: tableCols }).map((_, colIdx) => (
                  <Skeleton
                    key={colIdx}
                    className={cn(
                      'h-4 flex-1 bg-emerald-50/30 dark:bg-emerald-900/10',
                      colIdx === 0 && 'w-8 !flex-none'
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
