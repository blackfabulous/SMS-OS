'use client'

import { Filter, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ModuleToolbar, TableShell, KitEmptyState } from '@/components/module-ui'
import { statusConfig, formatDate } from './admissions-constants'
import type { Application } from './admissions-types'

interface AdmissionsApplicationsTabProps {
  applications: Application[]
  searchQuery: string
  onSearchChange: (v: string) => void
  statusFilter: string
  onStatusFilterChange: (v: string) => void
  onSelectApplication: (id: string) => void
}

const statusOptions = ['ALL', 'PENDING', 'ACTIVE', 'DROPPED_OUT', 'TRANSFERRED']

function statusLabel(status: string) {
  if (status === 'ALL') return 'All'
  if (status === 'ACTIVE') return 'Accepted'
  if (status === 'DROPPED_OUT') return 'Rejected'
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export function AdmissionsApplicationsTab({
  applications,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSelectApplication,
}: AdmissionsApplicationsTabProps) {
  return (
    <div className="space-y-4">
      <ModuleToolbar
        search={searchQuery}
        onSearch={onSearchChange}
        searchPlaceholder="Search by name, student number..."
        filters={<>
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {statusOptions.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-8 text-xs',
                statusFilter === status && 'bg-emerald-600 hover:bg-emerald-700 text-white'
              )}
              onClick={() => onStatusFilterChange(status)}
            >
              {statusLabel(status)}
            </Button>
          ))}
        </>}
      />

      <TableShell
        isEmpty={applications.length === 0}
        empty={<KitEmptyState icon={UserPlus} title="No applications found" />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Applicant</TableHead>
              <TableHead className="text-xs">Gender</TableHead>
              <TableHead className="text-xs">Grade</TableHead>
              <TableHead className="text-xs">Previous School</TableHead>
              <TableHead className="text-xs">Guardian</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => {
              const sc = statusConfig[app.enrollmentStatus] || statusConfig.PENDING
              const primaryParent = app.parentLinks.find((p) => p.isPrimary)?.parent
              const grade = app.enrollments[0]?.class?.grade?.name || 'N/A'
              return (
                <TableRow key={app.id} className="hover:bg-muted/30 cursor-pointer group" onClick={() => onSelectApplication(app.id)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
                        {app.firstName[0]}{app.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium group-hover:text-emerald-700 transition-colors">{app.firstName} {app.lastName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{app.studentNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{app.gender === 'MALE' ? 'Male' : 'Female'}</TableCell>
                  <TableCell className="text-sm font-medium">{grade}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{app.previousSchool || '\u2014'}</TableCell>
                  <TableCell className="text-sm">
                    {primaryParent ? `${primaryParent.firstName} ${primaryParent.lastName}` : '\u2014'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5', sc.color)}>
                      {sc.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(app.admissionDate)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  )
}
