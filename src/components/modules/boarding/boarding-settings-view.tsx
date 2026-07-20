'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Home, Clock, Shield, Bell, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SectionCard } from '@/components/module-ui'
import type { BoardingSettings } from './boarding-types'

interface BoardingSettingsViewProps {
  settings: BoardingSettings
  onSettingsChange: (settings: BoardingSettings) => void
  onBack: () => void
  onSave: () => void
}

export function BoardingSettingsView({ settings, onSettingsChange, onBack, onSave }: BoardingSettingsViewProps) {
  const set = <K extends keyof BoardingSettings>(k: K, v: BoardingSettings[K]) => {
    onSettingsChange({ ...settings, [k]: v })
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-lg font-semibold">Boarding Settings</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="House Defaults" icon={Home} contentClassName="space-y-4">
            <div className="grid gap-2">
              <Label className="text-sm">Default Gender Assignment</Label>
              <Select value={settings.defaultGender} onValueChange={(v) => set('defaultGender', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="MIXED">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Auto-Allocate Beds</Label>
                <p className="text-xs text-muted-foreground">Automatically assign bed numbers</p>
              </div>
              <Switch checked={settings.autoAllocate} onCheckedChange={(v) => set('autoAllocate', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show Bed Numbers</Label>
              <Switch checked={settings.showBedNumbers} onCheckedChange={(v) => set('showBedNumbers', v)} />
            </div>
        </SectionCard>

        <SectionCard title="Check-in / Check-out Rules" icon={Clock} contentClassName="space-y-4">
            <div className="grid gap-2">
              <Label className="text-sm">Curfew Time</Label>
              <Input type="time" value={settings.curfewTime} onChange={(e) => set('curfewTime', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-sm">Check-in Start</Label>
                <Input type="time" value={settings.checkInStartTime} onChange={(e) => set('checkInStartTime', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm">Check-in End</Label>
                <Input type="time" value={settings.checkInEndTime} onChange={(e) => set('checkInEndTime', e.target.value)} />
              </div>
            </div>
        </SectionCard>

        <SectionCard title="Visitor Policies" icon={Shield} contentClassName="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Visitors Allowed</Label>
              <Switch checked={settings.visitorAllowed} onCheckedChange={(v) => set('visitorAllowed', v)} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm">Visitor Hours</Label>
              <Input placeholder="e.g., 10:00-16:00" value={settings.visitorHours} onChange={(e) => set('visitorHours', e.target.value)} />
            </div>
        </SectionCard>

        <SectionCard title="Notifications" icon={Bell} contentClassName="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Notify on Check-in</Label>
                <p className="text-xs text-muted-foreground">Alert when students check in</p>
              </div>
              <Switch checked={settings.notifyOnCheckIn} onCheckedChange={(v) => set('notifyOnCheckIn', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Notify on Overstay</Label>
                <p className="text-xs text-muted-foreground">Alert when students miss curfew</p>
              </div>
              <Switch checked={settings.notifyOnOverstay} onCheckedChange={(v) => set('notifyOnOverstay', v)} />
            </div>
        </SectionCard>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={onSave} className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white">
          <Save className="mr-2 h-4 w-4" /> Save Settings
        </Button>
      </div>
    </motion.div>
  )
}
