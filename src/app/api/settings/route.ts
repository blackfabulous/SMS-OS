import { NextResponse } from 'next/server'
import { requireContext } from '@/server/context'
import { logAudit } from '@/lib/audit'
import { getAllSettings, setSettings } from '@/lib/settings'
import {
  SETTINGS_REGISTRY,
  SETTING_CATEGORIES,
  type SettingCategory,
  type SettingKey,
} from '@/lib/settings-schema'

/**
 * GET /api/settings[?category=grading]
 * Returns the resolved settings (defaults merged with stored values) plus the
 * registry metadata (label/category/default) so the UI can render controls.
 * Any authenticated user may read settings.
 */
export async function GET(request: Request) {
  // Unified auth + tenant + policy in one call (blueprint §3.2). Any authenticated
  // member of the school may read settings (dashboard is readable by all roles).
  const result = await requireContext({ module: 'dashboard', action: 'read' })
  if ('error' in result) return result.error
  const { ctx } = result

  const { searchParams } = new URL(request.url)
  const categoryParam = searchParams.get('category')
  const category = categoryParam && (SETTING_CATEGORIES as readonly string[]).includes(categoryParam)
    ? (categoryParam as SettingCategory)
    : undefined

  const values = await getAllSettings(ctx.schoolId, category)

  const meta = (Object.keys(SETTINGS_REGISTRY) as SettingKey[])
    .filter((k) => !category || SETTINGS_REGISTRY[k].category === category)
    .map((k) => ({
      key: k,
      category: SETTINGS_REGISTRY[k].category,
      label: SETTINGS_REGISTRY[k].label,
      description: SETTINGS_REGISTRY[k].description ?? null,
      value: values[k],
      default: SETTINGS_REGISTRY[k].default,
      ui: SETTINGS_REGISTRY[k].ui,
    }))

  return NextResponse.json({ categories: SETTING_CATEGORIES, settings: meta })
}

/**
 * PUT /api/settings  body: { settings: { "grading.passMark": 50, ... } }
 * Admin-only. Validates each entry against the registry; valid entries are
 * persisted, invalid/unknown keys are reported back with a 207-style payload.
 */
export async function PUT(request: Request) {
  // Writing settings is restricted to admins. NOTE: rbac.ts also grants BURSAR
  // settings:update — reconcile that matrix discrepancy under RA-B2 before
  // switching this to a pure module/action gate. Preserve the stricter behavior:
  const result = await requireContext({ roles: ['ADMIN', 'SUPER_ADMIN'], module: 'settings', action: 'update' })
  if ('error' in result) return result.error
  const { ctx } = result

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const entries = (body as { settings?: Record<string, unknown> })?.settings
  if (!entries || typeof entries !== 'object') {
    return NextResponse.json({ error: 'Body must be { settings: { key: value } }' }, { status: 400 })
  }

  const outcome = await setSettings(ctx.schoolId, entries)

  if (outcome.updated.length > 0) {
    logAudit({
      action: 'UPDATE',
      entity: 'settings',
      entityId: ctx.schoolId,
      afterValue: { updated: outcome.updated },
    }).catch(() => {})
  }

  const status = outcome.errors.length > 0 ? (outcome.updated.length > 0 ? 207 : 400) : 200
  return NextResponse.json(outcome, { status })
}
