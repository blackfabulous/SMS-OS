import type { ChartConfig } from '@/components/ui/chart'

export const positionColors: Record<string, string> = {
  Chairperson: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Secretary: 'bg-teal-100 text-teal-700 border-teal-200',
  Treasurer: 'bg-amber-100 text-amber-700 border-amber-200',
  'Vice Chairperson': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Committee Member': 'bg-muted text-muted-foreground border-border',
}

export const budgetChartConfig = {
  amount: { label: 'Amount (USD)', color: '#10b981' },
} satisfies ChartConfig

export const budgetData = [
  { category: 'Infrastructure', budget: 15000, actual: 12500 },
  { category: 'Furniture', budget: 5000, actual: 4200 },
  { category: 'ICT Equipment', budget: 8000, actual: 7500 },
  { category: 'Sports', budget: 3000, actual: 1800 },
  { category: 'Fundraising', budget: 2000, actual: 3500 },
]
