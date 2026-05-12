'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: React.ElementType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      {/* Icon in colored circle with subtle animation */}
      <div className="relative mb-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 ring-4 ring-emerald-100/80 dark:ring-emerald-900/30">
          <Icon className="h-9 w-9 text-emerald-500 dark:text-emerald-400" />
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-300 dark:bg-emerald-700 animate-pulse" />
        <div className="absolute -bottom-0.5 -left-2 h-2 w-2 rounded-full bg-teal-300 dark:bg-teal-700 animate-pulse [animation-delay:500ms]" />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-foreground mb-1.5">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-5">
        {description}
      </p>

      {/* Optional Action Button */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}
