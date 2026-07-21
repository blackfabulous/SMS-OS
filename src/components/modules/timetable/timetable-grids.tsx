'use client'

import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableShell } from '@/components/module-ui'
import { DAYS, PERIODS, PERIOD_TIMES } from './timetable-constants'
import type { UIEntry } from './timetable-types'

interface ColorPair {
  color: string
  bg: string
}

interface WeeklyGridProps {
  entries: UIEntry[]
  subjectColor: (id: string) => ColorPair
  onEdit: (entry: UIEntry) => void
}

export function WeeklyGrid({ entries, subjectColor, onEdit }: WeeklyGridProps) {
  return (
    <TableShell>
      <Table className="w-full min-w-[800px]">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-24 text-xs font-semibold text-muted-foreground text-left">Period</TableHead>
            {DAYS.map((day) => (
              <TableHead key={day} className="text-xs font-semibold text-muted-foreground text-center">{day}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {PERIODS.map((periodLabel, periodIdx) => (
            <TableRow key={periodIdx}>
              <TableCell className="bg-muted/30 py-2">
                <div className="text-xs font-medium">{periodLabel}</div>
                <div className="text-[10px] text-muted-foreground">{PERIOD_TIMES[periodIdx]}</div>
              </TableCell>
              {DAYS.map((day) => {
                const entry = entries.find((e) => e.day === day && e.period === periodIdx)
                if (!entry) {
                  return (
                    <TableCell key={day} className="p-1">
                      <div className="h-full min-h-[60px] flex items-center justify-center">
                        <span className="text-xs text-muted-foreground/40">—</span>
                      </div>
                    </TableCell>
                  )
                }
                const col = subjectColor(entry.subjectId)
                return (
                  <TableCell key={day} className="p-1">
                    <div
                      className={cn('rounded-lg p-2 min-h-[60px] cursor-pointer transition-all hover:shadow-sm border', col.bg, col.color)}
                      onClick={() => onEdit(entry)}
                    >
                      <div className="text-xs font-bold">{entry.subjectName}</div>
                      <div className="text-[10px] mt-0.5 opacity-80">{entry.teacherName}</div>
                      <div className="text-[10px] opacity-70">{entry.room || '—'}</div>
                    </div>
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableShell>
  )
}

interface TeacherScheduleGridProps {
  entries: UIEntry[]
  selectedTeacher: string
  subjectColor: (id: string) => ColorPair
}

export function TeacherScheduleGrid({ entries, selectedTeacher, subjectColor }: TeacherScheduleGridProps) {
  return (
    <TableShell>
      <Table className="w-full min-w-[800px]">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-24 text-xs font-semibold text-muted-foreground text-left">Period</TableHead>
            {DAYS.map((day) => (
              <TableHead key={day} className="text-xs font-semibold text-muted-foreground text-center">{day}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {PERIODS.map((periodLabel, periodIdx) => (
            <TableRow key={periodIdx}>
              <TableCell className="bg-muted/30 py-2">
                <div className="text-xs font-medium">{periodLabel}</div>
                <div className="text-[10px] text-muted-foreground">{PERIOD_TIMES[periodIdx]}</div>
              </TableCell>
              {DAYS.map((day) => {
                const entry = entries.find((e) => e.day === day && e.period === periodIdx)
                if (!entry) {
                  return (
                    <TableCell key={day} className="p-1">
                      <div className="h-full min-h-[60px] flex items-center justify-center">
                        {selectedTeacher !== 'all' ? (
                          <span className="text-[10px] text-emerald-600 font-medium">Free</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </div>
                    </TableCell>
                  )
                }
                const col = subjectColor(entry.subjectId)
                return (
                  <TableCell key={day} className="p-1">
                    <div className={cn('rounded-lg p-2 min-h-[60px] border', col.bg, col.color)}>
                      <div className="text-xs font-bold">{entry.subjectName}</div>
                      <div className="text-[10px] mt-0.5 opacity-80">{entry.className}</div>
                      <div className="text-[10px] opacity-70">{entry.room || '—'}</div>
                    </div>
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableShell>
  )
}
