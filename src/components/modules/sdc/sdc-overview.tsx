'use client'

import { Users, Calendar, FolderKanban, DollarSign, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StatGrid, ModuleStatCard, SectionCard } from '@/components/module-ui'
import { cn } from '@/lib/utils'
import { formatCurrency } from './sdc-utils'
import { positionColors } from './sdc-constants'
import type { SDCResponse } from './sdc-types'

interface SDCOverviewProps {
  stats: NonNullable<SDCResponse['stats']>
  schoolInfo: NonNullable<SDCResponse['schoolInfo']>
}

export function SDCOverview({ stats, schoolInfo }: SDCOverviewProps) {
  const leadership = ['Chairperson', 'Secretary', 'Treasurer'] as const

  return (
    <div className="space-y-4">
      <StatGrid cols={4}>
        <ModuleStatCard icon={Users} label="SDC Members" value={stats.totalMembers || 0} accentGradient="from-emerald-400 to-teal-500" bgColor="bg-emerald-50 dark:bg-emerald-950/40" iconColor="text-emerald-600 dark:text-emerald-400" hint={`${stats.activeMembers || 0} active`} index={0} />
        <ModuleStatCard icon={Calendar} label="Meetings This Term" value={stats.meetingsThisTerm || 0} accentGradient="from-teal-400 to-cyan-500" bgColor="bg-teal-50 dark:bg-teal-950/40" iconColor="text-teal-600 dark:text-teal-400" hint="Scheduled" index={1} />
        <ModuleStatCard icon={FolderKanban} label="Active Projects" value={stats.activeProjects || 0} accentGradient="from-amber-400 to-orange-500" bgColor="bg-amber-50 dark:bg-amber-950/40" iconColor="text-amber-600 dark:text-amber-400" hint="In progress" index={2} />
        <ModuleStatCard icon={DollarSign} label="Fund Balance" value={formatCurrency(stats.fundBalance || 0)} accentGradient="from-rose-400 to-pink-500" bgColor="bg-rose-50 dark:bg-rose-950/40" iconColor="text-rose-600 dark:text-rose-400" hint="SDC funds" index={3} />
      </StatGrid>

      {schoolInfo && (
        <SectionCard title="SDC Leadership">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {leadership.map((position) => {
              const key = `sdc${position}` as keyof typeof schoolInfo
              const name = schoolInfo[key]
              return (
                <div key={position} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm font-bold">
                    {name ? name[0] : '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{name || 'Not assigned'}</p>
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', positionColors[position])}>
                      {position}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
