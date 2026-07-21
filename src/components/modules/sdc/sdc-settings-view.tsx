'use client'

import { ArrowLeft, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SectionCard } from '@/components/module-ui'
import { toast } from 'sonner'

interface SDCSettings {
  autoScheduleMeetings: boolean
  votingEnabled: boolean
  documentTemplates: boolean
  termDuration: string
  quorumRequired: string
}

interface SDCSettingsViewProps {
  settings: SDCSettings
  setSettings: React.Dispatch<React.SetStateAction<SDCSettings>>
  onBack: () => void
}

export function SDCSettingsView({ settings, setSettings, onBack }: SDCSettingsViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Settings className="h-6 w-6 text-emerald-600" /> SDC Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure SDC/SDA governance module</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Meeting Schedule" description="Default meeting configuration" contentClassName="space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Auto-Schedule Meetings</p><p className="text-xs text-muted-foreground">Automatically schedule recurring meetings</p></div>
            <Switch checked={settings.autoScheduleMeetings} onCheckedChange={(v) => setSettings((s) => ({ ...s, autoScheduleMeetings: v }))} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Term Duration (years)</p><p className="text-xs text-muted-foreground">Default committee term length</p></div>
            <Select value={settings.termDuration} onValueChange={(v) => setSettings((s) => ({ ...s, termDuration: v }))}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Year</SelectItem>
                <SelectItem value="2">2 Years</SelectItem>
                <SelectItem value="3">3 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SectionCard>
        <SectionCard title="Voting & Quorum" description="Voting and quorum settings" contentClassName="space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Voting Enabled</p><p className="text-xs text-muted-foreground">Enable voting on resolutions</p></div>
            <Switch checked={settings.votingEnabled} onCheckedChange={(v) => setSettings((s) => ({ ...s, votingEnabled: v }))} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Quorum Required (%)</p><p className="text-xs text-muted-foreground">Minimum attendance for decisions</p></div>
            <Select value={settings.quorumRequired} onValueChange={(v) => setSettings((s) => ({ ...s, quorumRequired: v }))}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="33">33%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="67">67%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SectionCard>
        <SectionCard title="Document Templates" description="Meeting minutes and agenda templates" contentClassName="space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Use Document Templates</p><p className="text-xs text-muted-foreground">Auto-generate minutes templates</p></div>
            <Switch checked={settings.documentTemplates} onCheckedChange={(v) => setSettings((s) => ({ ...s, documentTemplates: v }))} />
          </div>
        </SectionCard>
      </div>
      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" onClick={() => { toast.success('Settings saved successfully'); onBack() }}>Save Settings</Button>
      </div>
    </div>
  )
}
