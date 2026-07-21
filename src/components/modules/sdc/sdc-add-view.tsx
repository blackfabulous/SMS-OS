'use client'

import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SDCMemberForm, SDCMeetingForm } from './sdc-types'

interface SDCAddViewProps {
  addType: 'member' | 'meeting'
  onAddTypeChange: (type: 'member' | 'meeting') => void
  memberForm: SDCMemberForm
  setMemberForm: React.Dispatch<React.SetStateAction<SDCMemberForm>>
  meetingForm: SDCMeetingForm
  setMeetingForm: React.Dispatch<React.SetStateAction<SDCMeetingForm>>
  isSubmitting: boolean
  onSubmit: () => void
  onCancel: () => void
}

export function SDCAddView({
  addType,
  onAddTypeChange,
  memberForm,
  setMemberForm,
  meetingForm,
  setMeetingForm,
  isSubmitting,
  onSubmit,
  onCancel,
}: SDCAddViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Button variant={addType === 'member' ? 'default' : 'outline'} size="sm" onClick={() => onAddTypeChange('member')}>Member</Button>
          <Button variant={addType === 'meeting' ? 'default' : 'outline'} size="sm" onClick={() => onAddTypeChange('meeting')}>Meeting</Button>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {addType === 'member' ? 'Add SDC Member' : 'Schedule SDC Meeting'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {addType === 'member' ? 'Add a new member to the School Development Committee' : 'Create a new meeting record'}
        </p>
      </div>
      <Card className="border-0 shadow-md">
        <CardContent className="p-6 space-y-4">
          {addType === 'member' ? (
            <>
              <div className="grid gap-2"><Label>Full Name *</Label><Input placeholder="Full name" value={memberForm.name} onChange={(e) => setMemberForm((p) => ({ ...p, name: e.target.value }))} /></div>
              <div className="grid gap-2">
                <Label>Position *</Label>
                <Select value={memberForm.position} onValueChange={(v) => setMemberForm((p) => ({ ...p, position: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chairperson">Chairperson</SelectItem>
                    <SelectItem value="Vice Chairperson">Vice Chairperson</SelectItem>
                    <SelectItem value="Secretary">Secretary</SelectItem>
                    <SelectItem value="Treasurer">Treasurer</SelectItem>
                    <SelectItem value="Committee Member">Committee Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Phone</Label><Input placeholder="+263..." value={memberForm.phone} onChange={(e) => setMemberForm((p) => ({ ...p, phone: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Email</Label><Input placeholder="email@example.com" value={memberForm.email} onChange={(e) => setMemberForm((p) => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Term Start</Label><Input type="date" value={memberForm.termStart} onChange={(e) => setMemberForm((p) => ({ ...p, termStart: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Term End</Label><Input type="date" value={memberForm.termEnd} onChange={(e) => setMemberForm((p) => ({ ...p, termEnd: e.target.value }))} /></div>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-2"><Label>Meeting Title *</Label><Input placeholder="e.g. SDC Quarterly Meeting" value={meetingForm.title} onChange={(e) => setMeetingForm((p) => ({ ...p, title: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Agenda / Description</Label><Input placeholder="Meeting agenda items" value={meetingForm.description} onChange={(e) => setMeetingForm((p) => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Date *</Label><Input type="date" value={meetingForm.startDate} onChange={(e) => setMeetingForm((p) => ({ ...p, startDate: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Venue</Label><Input placeholder="e.g. School Hall" value={meetingForm.venue} onChange={(e) => setMeetingForm((p) => ({ ...p, venue: e.target.value }))} /></div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" disabled={isSubmitting} onClick={onSubmit}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {addType === 'member' ? 'Add Member' : 'Schedule Meeting'}
        </Button>
      </div>
    </div>
  )
}
