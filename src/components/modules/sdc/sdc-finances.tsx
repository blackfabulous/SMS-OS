'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { SectionCard } from '@/components/module-ui'
import { cn } from '@/lib/utils'
import { budgetChartConfig, budgetData } from './sdc-constants'
import { formatCurrency } from './sdc-utils'

export function SDCFinances() {
  const totalBudget = budgetData.reduce((s, b) => s + b.budget, 0)
  const totalActual = budgetData.reduce((s, b) => s + b.actual, 0)
  const totalVariance = budgetData.reduce((s, b) => s + b.budget - b.actual, 0)

  return (
    <div className="space-y-4">
      <SectionCard title="SDC Fund Management" description="Budget vs Actual expenditure">
        <ChartContainer config={budgetChartConfig} className="h-[280px] w-full">
          <BarChart data={budgetData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="budget" fill="#d1d5db" radius={[4, 4, 0, 0]} maxBarSize={32} name="Budget" />
            <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} name="Actual" />
          </BarChart>
        </ChartContainer>
      </SectionCard>

      <SectionCard title="Budget Summary" noPadding>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs text-right">Budget</TableHead>
              <TableHead className="text-xs text-right">Actual</TableHead>
              <TableHead className="text-xs text-right">Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budgetData.map((item) => {
              const variance = item.budget - item.actual
              return (
                <TableRow key={item.category} className="hover:bg-muted/30">
                  <TableCell className="text-sm font-medium">{item.category}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCurrency(item.budget)}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCurrency(item.actual)}</TableCell>
                  <TableCell className={cn('text-sm text-right font-mono font-semibold', variance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                  </TableCell>
                </TableRow>
              )
            })}
            <TableRow className="font-bold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(totalBudget)}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(totalActual)}</TableCell>
              <TableCell className={cn('text-right font-mono', totalVariance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                {formatCurrency(totalVariance)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  )
}
