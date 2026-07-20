'use client'

import { Users, Phone, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SectionCard } from '@/components/module-ui'
import { cn } from '@/lib/utils'
import { positionColors } from './sdc-constants'
import { formatDate } from './sdc-utils'
import type { SDCMember } from './sdc-types'

interface SDCMembersProps {
  members: SDCMember[]
}

export function SDCMembers({ members }: SDCMembersProps) {
  return (
    <SectionCard title="SDC Members" description="Committee members and their positions" noPadding>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Name</TableHead>
            <TableHead className="text-xs">Position</TableHead>
            <TableHead className="text-xs">Contact</TableHead>
            <TableHead className="text-xs">Term</TableHead>
            <TableHead className="text-xs">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id} className="hover:bg-muted/30">
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
                    {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium">{member.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5', positionColors[member.position] || positionColors['Committee Member'])}>
                  {member.position}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  {member.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />{member.phone}
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />{member.email}
                    </div>
                  )}
                  {!member.phone && !member.email && <span className="text-xs text-muted-foreground">—</span>}
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {member.termStart && member.termEnd
                  ? `${formatDate(member.termStart)} — ${formatDate(member.termEnd)}`
                  : 'Not set'}
              </TableCell>
              <TableCell>
                <Badge className={cn('text-[10px]', member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground')}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No SDC members added yet</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </SectionCard>
  )
}
