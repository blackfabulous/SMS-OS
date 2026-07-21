'use client'

import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/module-ui'
import type { SDCMeeting } from './sdc-types'

interface SDCMeetingsProps {
  meetings: SDCMeeting[]
}

export function SDCMeetings({ meetings }: SDCMeetingsProps) {
  return (
    <SectionCard title="Meeting Records" description="SDC meetings with agendas, minutes, and resolutions">
      {meetings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No meetings scheduled</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="flex items-start gap-4 p-4 rounded-xl border hover:bg-muted/30 transition-colors">
              <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shrink-0">
                <span className="text-[10px] font-medium leading-none">
                  {new Date(meeting.startDate).toLocaleDateString('en-ZW', { month: 'short' })}
                </span>
                <span className="text-lg font-bold leading-none mt-0.5">
                  {new Date(meeting.startDate).getDate()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{meeting.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{meeting.description || 'No agenda details'}</p>
                <div className="flex items-center gap-3 mt-2">
                  {meeting.venue && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{meeting.venue}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />{new Date(meeting.startDate).toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
