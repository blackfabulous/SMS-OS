'use client'

import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ModuleContainer, SectionCard } from '@/components/module-ui'
import type { ApplicationForm } from './admissions-types'

interface AdmissionsAddFormProps {
  form: ApplicationForm
  onFormChange: (form: ApplicationForm) => void
  submitting: boolean
  onSubmit: () => void
  onCancel: () => void
}

const docChecklist = ['Birth Certificate', 'Previous School Report', 'Transfer Letter', 'Passport Photo', 'Immunisation Card', 'National ID Copy']

export function AdmissionsAddForm({ form, onFormChange, submitting, onSubmit, onCancel }: AdmissionsAddFormProps) {
  const set = <K extends keyof ApplicationForm>(k: K, v: ApplicationForm[K]) => {
    onFormChange({ ...form, [k]: v })
  }

  return (
    <ModuleContainer>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Application</h1>
        <p className="text-sm text-muted-foreground mt-1">Submit a new student admission application</p>
      </div>

      <SectionCard>
        <div className="grid gap-6 max-w-3xl">
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-emerald-700">Student Details</Label>
            <Separator />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>First Name *</Label>
              <Input placeholder="First name" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Last Name *</Label>
              <Input placeholder="Last name" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Middle Name</Label>
              <Input placeholder="Middle name" value={form.middleName} onChange={(e) => set('middleName', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Birth Certificate #</Label>
              <Input placeholder="e.g. 08-123456A78" value={form.birthCertNumber} onChange={(e) => set('birthCertNumber', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>National ID</Label>
              <Input placeholder="e.g. 08-1234567X89" value={form.nationalId} onChange={(e) => set('nationalId', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Boarding Status</Label>
              <Select value={form.boardingStatus} onValueChange={(v) => set('boardingStatus', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAY_SCHOLAR">Day Scholar</SelectItem>
                  <SelectItem value="BOARDER">Boarder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Previous School</Label>
              <Input placeholder="Previous school name" value={form.previousSchool} onChange={(e) => set('previousSchool', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <Label className="text-sm font-semibold text-emerald-700">Guardian Details</Label>
            <Separator />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Guardian First Name</Label>
              <Input placeholder="First name" value={form.guardianFirstName} onChange={(e) => set('guardianFirstName', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Guardian Last Name</Label>
              <Input placeholder="Last name" value={form.guardianLastName} onChange={(e) => set('guardianLastName', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input placeholder="+263..." value={form.guardianPhone} onChange={(e) => set('guardianPhone', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input placeholder="email@example.com" value={form.guardianEmail} onChange={(e) => set('guardianEmail', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Relationship</Label>
              <Select value={form.guardianRelationship} onValueChange={(v) => set('guardianRelationship', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  <SelectItem value="GUARDIAN">Guardian</SelectItem>
                  <SelectItem value="GRANDPARENT">Grandparent</SelectItem>
                  <SelectItem value="SIBLING">Sibling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <Label className="text-sm font-semibold text-emerald-700">Documents Checklist</Label>
            <Separator />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {docChecklist.map((doc) => (
              <label key={doc} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded border-border text-muted-foreground focus:ring-emerald-500" />
                <span>{doc}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={onSubmit} disabled={submitting || !form.firstName || !form.lastName} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </div>
        </div>
      </SectionCard>
    </ModuleContainer>
  )
}
