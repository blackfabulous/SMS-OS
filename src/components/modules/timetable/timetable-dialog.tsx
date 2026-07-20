'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DAYS, PERIODS, PERIOD_TIMES } from './timetable-constants'
import type { RefClass, RefSubject, RefTeacher, TimetableForm, UIEntry } from './timetable-types'

interface TimetableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editEntry: UIEntry | null
  form: TimetableForm
  setForm: React.Dispatch<React.SetStateAction<TimetableForm>>
  classes: RefClass[]
  subjects: RefSubject[]
  teachers: RefTeacher[]
  subjName: (id: string) => string
  busy: boolean
  onSave: () => void
}

export function TimetableDialog({
  open,
  onOpenChange,
  editEntry,
  form,
  setForm,
  classes,
  subjects,
  teachers,
  subjName,
  busy,
  onSave,
}: TimetableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}</DialogTitle>
          <DialogDescription>
            {editEntry ? 'Modify the schedule entry details' : 'Create a new timetable slot'}. Conflicts (class / teacher / room) are detected automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Class</Label>
              <Select value={form.classId} onValueChange={(v) => setForm((p) => ({ ...p, classId: v }))}>
                <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>{classes.map((cls) => <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Subject</Label>
              <Select value={form.subjectId} onValueChange={(v) => setForm((p) => ({ ...p, subjectId: v }))}>
                <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Teacher</Label>
              <Select value={form.teacherId} onValueChange={(v) => setForm((p) => ({ ...p, teacherId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Room</Label>
              <Input value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} placeholder="e.g. Room 1 / Science Lab" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Day</Label>
              <Select value={form.day} onValueChange={(v) => setForm((p) => ({ ...p, day: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Period</Label>
              <Select value={form.period} onValueChange={(v) => setForm((p) => ({ ...p, period: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIODS.map((periodLabel, idx) => (
                    <SelectItem key={idx} value={String(idx)}>{periodLabel} ({PERIOD_TIMES[idx]})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.subjectId && (
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-medium">{subjName(form.subjectId)}</span>
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={busy} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {editEntry ? 'Save Changes' : 'Add Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
