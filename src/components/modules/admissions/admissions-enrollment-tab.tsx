'use client'

import { CheckCircle2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionCard, KitEmptyState } from '@/components/module-ui'
import type { Application } from './admissions-types'

interface AdmissionsEnrollmentTabProps {
  acceptedApps: Application[]
}

export function AdmissionsEnrollmentTab({ acceptedApps }: AdmissionsEnrollmentTabProps) {
  return (
    <div className="space-y-4">
      <SectionCard
        title="Accepted Applications — Ready to Enroll"
        description="Convert accepted applications to enrolled students"
      >
        {acceptedApps.length === 0 ? (
          <KitEmptyState icon={CheckCircle2} title="No accepted applications to enroll" />
        ) : (
          <div className="space-y-3">
            {acceptedApps.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm font-semibold">
                    {app.firstName[0]}{app.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{app.firstName} {app.lastName}</p>
                    <p className="text-xs text-muted-foreground">{app.studentNumber} &middot; {app.enrollments[0]?.class?.grade?.name || 'No grade assigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Accepted</Badge>
                  <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-8">
                    <ChevronRight className="mr-1 h-3 w-3" />
                    Enroll
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
