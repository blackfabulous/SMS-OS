'use client'

import { FolderKanban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SectionCard } from '@/components/module-ui'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from './sdc-utils'
import type { SDCProject } from './sdc-types'

interface SDCProjectsProps {
  projects: SDCProject[]
}

const progressValues = [65, 30, 85, 50, 20]
const budgets = [15000, 8000, 5000, 3000, 12000]

export function SDCProjects({ projects }: SDCProjectsProps) {
  return (
    <SectionCard title="School Development Projects" description="Projects with budgets, progress, and timelines">
      {projects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No projects recorded</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((project, index) => {
            const progress = progressValues[index % progressValues.length]
            const budget = budgets[index % budgets.length]
            return (
              <div key={project.id} className="p-4 rounded-xl border hover:shadow-md transition-shadow space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{project.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{project.description || 'No description'}</p>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] px-1.5', progress >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : progress >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200')}>
                    {progress >= 80 ? 'On Track' : progress >= 40 ? 'In Progress' : 'Starting'}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Budget: {formatCurrency(budget)}</span>
                  <span className="text-muted-foreground">Due: {project.endDate ? formatDate(project.endDate) : 'TBD'}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}
