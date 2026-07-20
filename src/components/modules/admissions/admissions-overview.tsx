'use client'

import { FileText, CheckCircle2, Clock, XCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { StatGrid, ModuleStatCard, SectionCard } from '@/components/module-ui'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { funnelChartConfig } from './admissions-types'
import type { AdmissionStats } from './admissions-types'

interface AdmissionsOverviewProps {
  stats: AdmissionStats | null
}

export function AdmissionsOverview({ stats }: AdmissionsOverviewProps) {
  const funnelData = stats ? [
    { stage: 'Applications', count: stats.total },
    { stage: 'Accepted', count: stats.active },
    { stage: 'Pending', count: stats.pending },
    { stage: 'Rejected', count: stats.droppedOut },
  ] : []

  return (
    <div className="space-y-4">
      <StatGrid cols={4}>
        <ModuleStatCard
          icon={FileText}
          label="Applications"
          value={stats?.total || 0}
          accentGradient="from-emerald-400 to-teal-500"
          trend={{ value: 'Total received', positive: true }}
          index={0}
        />
        <ModuleStatCard
          icon={CheckCircle2}
          label="Accepted"
          value={stats?.active || 0}
          accentGradient="from-teal-400 to-cyan-500"
          bgColor="bg-teal-50 dark:bg-teal-950/40"
          iconColor="text-teal-600 dark:text-teal-400"
          trend={{ value: 'Enrolled', positive: true }}
          index={1}
        />
        <ModuleStatCard
          icon={Clock}
          label="Pending"
          value={stats?.pending || 0}
          accentGradient="from-amber-400 to-orange-500"
          bgColor="bg-amber-50 dark:bg-amber-950/40"
          iconColor="text-amber-600 dark:text-amber-400"
          trend={{ value: 'Awaiting review', positive: true }}
          index={2}
        />
        <ModuleStatCard
          icon={XCircle}
          label="Rejected"
          value={(stats?.droppedOut || 0) + (stats?.transferred || 0)}
          accentGradient="from-red-400 to-rose-500"
          bgColor="bg-red-50 dark:bg-red-950/40"
          iconColor="text-red-500 dark:text-red-400"
          trend={{ value: 'Not accepted', positive: false }}
          index={3}
        />
      </StatGrid>

      <SectionCard title="Admission Funnel" description="Application to enrollment conversion">
        <ChartContainer config={funnelChartConfig} className="h-[250px] w-full">
          <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} maxBarSize={40} />
          </BarChart>
        </ChartContainer>
      </SectionCard>
    </div>
  )
}
