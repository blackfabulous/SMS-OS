'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SectionCard, TableShell, KitEmptyState } from '@/components/module-ui'
import { formatDate } from './admissions-constants'
import type { Application } from './admissions-types'

interface AdmissionsWaitingTabProps {
  waitlistedApps: Application[]
}

export function AdmissionsWaitingTab({ waitlistedApps }: AdmissionsWaitingTabProps) {
  return (
    <div className="space-y-4">
      <SectionCard
        title="Waiting List"
        description="Applicants waiting for available spots"
      >
        <TableShell
          isEmpty={waitlistedApps.length === 0}
          empty={<KitEmptyState icon={AlertTriangle} title="No applicants on the waiting list" />}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">#</TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Gender</TableHead>
                <TableHead className="text-xs">Desired Grade</TableHead>
                <TableHead className="text-xs">Date Added</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waitlistedApps.map((app, index) => (
                <TableRow key={app.id} className="hover:bg-muted/30">
                  <TableCell className="text-sm font-bold text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="text-sm font-medium">{app.firstName} {app.lastName}</TableCell>
                  <TableCell className="text-sm">{app.gender === 'MALE' ? 'Male' : 'Female'}</TableCell>
                  <TableCell className="text-sm">{app.enrollments[0]?.class?.grade?.name || 'N/A'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(app.admissionDate)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                      Accept
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableShell>
      </SectionCard>
    </div>
  )
}
