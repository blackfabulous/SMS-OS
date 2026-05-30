'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, RotateCcw, AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SettingUi } from '@/lib/settings-schema'

interface SettingMeta {
  key: string
  category: string
  label: string
  description: string | null
  value: unknown
  default: unknown
  ui: SettingUi
}

interface GradeBand {
  symbol: string
  min: number
  max: number
  descriptor: string
}

const CATEGORY_LABELS: Record<string, string> = {
  academic: 'Academic',
  grading: 'Grading',
  finance: 'Finance',
  attendance: 'Attendance',
  notifications: 'Notifications',
  branding: 'Branding',
}

/**
 * Registry-driven settings editor. Renders a control for every setting exposed
 * by GET /api/settings (grouped by category) and persists changes via PUT.
 * No per-setting code lives here — the registry's `ui` metadata drives the form.
 */
export function SettingsRegistryPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [metas, setMetas] = useState<SettingMeta[]>([])
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [original, setOriginal] = useState<Record<string, unknown>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      const data = (await res.json()) as { settings: SettingMeta[] }
      const v: Record<string, unknown> = {}
      data.settings.forEach((s) => { v[s.key] = s.value })
      setMetas(data.settings)
      setValues(v)
      setOriginal(structuredClone(v))
      setFieldErrors({})
    } catch {
      toast.error('Could not load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const dirtyKeys = useMemo(
    () => metas.map((m) => m.key).filter((k) => JSON.stringify(values[k]) !== JSON.stringify(original[k])),
    [metas, values, original],
  )

  const setValue = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const save = useCallback(async () => {
    if (dirtyKeys.length === 0) return
    setSaving(true)
    setFieldErrors({})
    try {
      const payload = Object.fromEntries(dirtyKeys.map((k) => [k, values[k]]))
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      })
      const result = (await res.json()) as { updated?: string[]; errors?: { key: string; error: string }[] }

      if (result.errors && result.errors.length > 0) {
        const errs: Record<string, string> = {}
        result.errors.forEach((e) => { errs[e.key] = e.error })
        setFieldErrors(errs)
      }
      if (result.updated && result.updated.length > 0) {
        // commit saved keys into the baseline
        setOriginal((prev) => {
          const next = { ...prev }
          result.updated!.forEach((k) => { next[k] = structuredClone(values[k]) })
          return next
        })
        toast.success(`Saved ${result.updated.length} setting${result.updated.length === 1 ? '' : 's'}`)
      }
      if (result.errors && result.errors.length > 0) {
        toast.error(`${result.errors.length} setting${result.errors.length === 1 ? '' : 's'} could not be saved`)
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }, [dirtyKeys, values])

  const reset = useCallback(() => {
    setValues(structuredClone(original))
    setFieldErrors({})
  }, [original])

  const grouped = useMemo(() => {
    const map = new Map<string, SettingMeta[]>()
    for (const m of metas) {
      if (!map.has(m.category)) map.set(m.category, [])
      map.get(m.category)!.push(m)
    }
    return [...map.entries()]
  }, [metas])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading settings…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Sticky action bar */}
      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {dirtyKeys.length === 0 ? 'All changes saved.' : `${dirtyKeys.length} unsaved change${dirtyKeys.length === 1 ? '' : 's'}.`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset} disabled={dirtyKeys.length === 0 || saving}>
            <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
          </Button>
          <Button size="sm" onClick={save} disabled={dirtyKeys.length === 0 || saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </div>

      {grouped.map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-base">{CATEGORY_LABELS[category] ?? category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {items.map((meta) => (
              <SettingField
                key={meta.key}
                meta={meta}
                value={values[meta.key]}
                error={fieldErrors[meta.key]}
                dirty={dirtyKeys.includes(meta.key)}
                onChange={(v) => setValue(meta.key, v)}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SettingField({
  meta, value, error, dirty, onChange,
}: {
  meta: SettingMeta
  value: unknown
  error?: string
  dirty: boolean
  onChange: (v: unknown) => void
}) {
  const id = `setting-${meta.key}`
  return (
    <fieldset className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {meta.label}
          {dirty && <span className="ml-2 text-xs font-normal text-amber-600">• unsaved</span>}
        </Label>
      </div>
      {meta.description && <p className="text-xs text-muted-foreground">{meta.description}</p>}
      <Control id={id} ui={meta.ui} value={value} onChange={onChange} />
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600" role="alert">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </fieldset>
  )
}

function Control({ id, ui, value, onChange }: { id: string; ui: SettingUi; value: unknown; onChange: (v: unknown) => void }) {
  switch (ui.control) {
    case 'text':
      return <Input id={id} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className="max-w-xs" />

    case 'number':
      return (
        <Input
          id={id}
          type="number"
          min={ui.min}
          max={ui.max}
          step={ui.step}
          value={Number(value ?? 0)}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className="max-w-[140px]"
        />
      )

    case 'toggle':
      return <Switch id={id} checked={Boolean(value)} onCheckedChange={(c) => onChange(c)} />

    case 'color':
      return (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="color"
            value={String(value ?? '#000000')}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-border bg-background"
            aria-label="Colour picker"
          />
          <Input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className="max-w-[140px] font-mono" />
        </div>
      )

    case 'select':
      return (
        <select
          id={id}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        >
          {ui.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )

    case 'multiselect': {
      const selected = Array.isArray(value) ? (value as string[]) : []
      const toggle = (opt: string, on: boolean) =>
        onChange(on ? [...selected, opt] : selected.filter((s) => s !== opt))
      return (
        <div className="flex flex-wrap gap-3" role="group" aria-labelledby={id}>
          {ui.options.map((opt) => {
            const cid = `${id}-${opt}`
            return (
              <label key={opt} htmlFor={cid} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-3 py-1.5 text-sm">
                <Checkbox id={cid} checked={selected.includes(opt)} onCheckedChange={(c) => toggle(opt, Boolean(c))} />
                {opt}
              </label>
            )
          })}
        </div>
      )
    }

    case 'gradeScale':
      return <GradeScaleEditor value={Array.isArray(value) ? (value as GradeBand[]) : []} onChange={onChange} />
  }
}

function GradeScaleEditor({ value, onChange }: { value: GradeBand[]; onChange: (v: GradeBand[]) => void }) {
  const update = (i: number, patch: Partial<GradeBand>) =>
    onChange(value.map((b, idx) => (idx === i ? { ...b, ...patch } : b)))
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i))
  const add = () => onChange([...value, { symbol: '', min: 0, max: 0, descriptor: '' }])

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Symbol</th>
            <th className="px-3 py-2 font-medium">Min %</th>
            <th className="px-3 py-2 font-medium">Max %</th>
            <th className="px-3 py-2 font-medium">Descriptor</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {value.map((band, i) => (
            <tr key={i}>
              <td className="px-2 py-1.5"><Input aria-label="Symbol" value={band.symbol} onChange={(e) => update(i, { symbol: e.target.value })} className="h-8 w-16" /></td>
              <td className="px-2 py-1.5"><Input aria-label="Minimum" type="number" min={0} max={100} value={band.min} onChange={(e) => update(i, { min: Number(e.target.value) })} className="h-8 w-20" /></td>
              <td className="px-2 py-1.5"><Input aria-label="Maximum" type="number" min={0} max={100} value={band.max} onChange={(e) => update(i, { max: Number(e.target.value) })} className="h-8 w-20" /></td>
              <td className="px-2 py-1.5"><Input aria-label="Descriptor" value={band.descriptor} onChange={(e) => update(i, { descriptor: e.target.value })} className="h-8" /></td>
              <td className="px-2 py-1.5 text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => remove(i)} aria-label="Remove band">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-border/60 p-2">
        <Button variant="ghost" size="sm" onClick={add}><Plus className="mr-1.5 h-4 w-4" /> Add band</Button>
      </div>
    </div>
  )
}
