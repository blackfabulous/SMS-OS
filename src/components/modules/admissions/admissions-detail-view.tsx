'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ModuleContainer, SectionCard } from '@/components/module-ui'
import { cn } from '@/lib/utils'
import { statusConfig, formatDate } from './admissions-constants'
import type { Application } from './admissions-types'

interface AdmissionsDetailViewProps {
  application: Application
  onBack: () => void
}

export function AdmissionsDetailView({ application, onBack }: AdmissionsDetailViewProps) {
  const sc = statusConfig[application.enrollmentStatus] || statusConfig.PENDING
  const className = application.enrollments[0]?.class?.name || 'Not assigned'
  const grade = application.enrollments[0]?.class?.grade?.name || 'N/A'

  return (
    <ModuleContainer>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-lg font-semibold">
          {application.firstName[0]}{application.lastName[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{application.firstName} {application.lastName}</h1>
          <p className="text-sm text-muted-foreground">{application.studentNumber} &middot; {grade}</p>
        </div>
        <Badge variant="outline" className={cn('text-xs px-3 py-1 ml-auto', sc.color)}>
          {sc.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Student Information">
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Student Number</span><span className="text-sm font-mono font-semibold">{application.studentNumber}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Full Name</span><span className="text-sm font-medium">{application.firstName} {application.middleName || ''} {application.lastName}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Gender</span><span className="text-sm">{application.gender === 'MALE' ? 'Male' : 'Female'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Date of Birth</span><span className="text-sm">{application.dateOfBirth ? formatDate(application.dateOfBirth) : 'N/A'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Boarding Status</span><span className="text-sm">{application.boardingStatus === 'BOARDER' ? 'Boarder' : 'Day Scholar'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Previous School</span><span className="text-sm">{application.previousSchool || 'N/A'}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Admission Date</span><span className="text-sm">{formatDate(application.admissionDate)}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Class</span><span className="text-sm">{className}</span></div>
          </div>
        </SectionCard>

        <SectionCard title="Guardian Information">
          <div className="space-y-4">
            {application.parentLinks.map((link, idx) => (
              <div key={idx} className={cn('p-4 rounded-xl border', link.isPrimary ? 'border-emerald-200 bg-emerald-50/50' : 'border-muted')}>
                <div className="flex items-center justify-between mb-2">
                   <span className="text-sm font-semibold">{link.parent.firstName} {link.parent.lastName}</span>
                   <div className="flex items-center gap-2">
                     <Badge variant="outline" className="text-[10px]">{link.relationship}</Badge>
                     {link.isPrimary && <Badge className="text-[10px] bg-emerald-100 text-emerald-700">Primary</Badge>}
                   </div>
                </div>
                <div className="space-y-1.5">
                   <div className="flex justify-between"><span className="text-xs text-muted-foreground">Phone</span><span className="text-xs font-medium">{link.parent.phone}</span></div>
                   {link.parent.email && <div className="flex justify-between"><span className="text-xs text-muted-foreground">Email</span><span className="text-xs font-medium">{link.parent.email}</span></div>}
                </div>
              </div>
            ))}
            {application.parentLinks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No guardian information available</p>
            )}
          </div>
        </SectionCard>
      </div>
    </ModuleContainer>
  )
}
