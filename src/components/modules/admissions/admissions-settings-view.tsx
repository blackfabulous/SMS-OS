'use client'

import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ModuleContainer, SectionCard } from '@/components/module-ui'
import { toast } from 'sonner'

export interface AdmissionsSettings {
  defaultIntakeYear: string
  applicationFeeAmount: string
  maxApplicationsPerGrade: string
  welcomeMessage: string
  requireBirthCert: boolean
  requireTransferLetter: boolean
  requireInterview: boolean
  autoAssignStudentNumber: boolean
  notifyGuardianOnStatusChange: boolean
}

interface AdmissionsSettingsViewProps {
  settings: AdmissionsSettings
  onSettingsChange: (settings: AdmissionsSettings) => void
  onBack: () => void
}

export function AdmissionsSettingsView({ settings, onSettingsChange, onBack }: AdmissionsSettingsViewProps) {
  const set = <K extends keyof AdmissionsSettings>(k: K, v: AdmissionsSettings[K]) => {
    onSettingsChange({ ...settings, [k]: v })
  }

  return (
    <ModuleContainer>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admissions Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure admission process, requirements, and defaults</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Default Configuration" description="Set defaults for new applications">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Default Intake Year</Label>
              <Input value={settings.defaultIntakeYear} onChange={e => set('defaultIntakeYear', e.target.value)} placeholder="e.g. 2026" />
            </div>
            <div className="grid gap-2">
              <Label>Application Fee (USD)</Label>
              <Input type="number" value={settings.applicationFeeAmount} onChange={e => set('applicationFeeAmount', e.target.value)} placeholder="0.00" />
            </div>
            <div className="grid gap-2">
              <Label>Max Applications Per Grade</Label>
              <Input type="number" value={settings.maxApplicationsPerGrade} onChange={e => set('maxApplicationsPerGrade', e.target.value)} placeholder="50" />
            </div>
            <div className="grid gap-2">
              <Label>Welcome Message for Applicants</Label>
              <Textarea value={settings.welcomeMessage} onChange={e => set('welcomeMessage', e.target.value)} rows={3} placeholder="Welcome message..." />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Document Requirements" description="Required documents for application submission">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Birth Certificate</p>
                <p className="text-xs text-muted-foreground">Require birth certificate copy</p>
              </div>
              <Switch checked={settings.requireBirthCert} onCheckedChange={v => set('requireBirthCert', v)} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Transfer Letter</p>
                <p className="text-xs text-muted-foreground">Require transfer letter from previous school</p>
              </div>
              <Switch checked={settings.requireTransferLetter} onCheckedChange={v => set('requireTransferLetter', v)} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Interview Required</p>
                <p className="text-xs text-muted-foreground">Schedule interview before acceptance</p>
              </div>
              <Switch checked={settings.requireInterview} onCheckedChange={v => set('requireInterview', v)} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Auto-assign Student Number</p>
                <p className="text-xs text-muted-foreground">Automatically generate student numbers</p>
              </div>
              <Switch checked={settings.autoAssignStudentNumber} onCheckedChange={v => set('autoAssignStudentNumber', v)} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Notify Guardian on Status Change</p>
                <p className="text-xs text-muted-foreground">Send SMS/email when application status changes</p>
              </div>
              <Switch checked={settings.notifyGuardianOnStatusChange} onCheckedChange={v => set('notifyGuardianOnStatusChange', v)} />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" onClick={() => toast.success('Settings saved successfully')}>
          <Save className="mr-2 h-4 w-4" /> Save Settings
        </Button>
      </div>
    </ModuleContainer>
  )
}
