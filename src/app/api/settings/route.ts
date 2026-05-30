import { NextResponse } from 'next/server'
import { validateAuth, validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
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
  const auth = await validateAuth()
  if ('error' in auth) return auth.error
  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error

  const { searchParams } = new URL(request.url)
  const categoryParam = searchParams.get('category')
  const category = categoryParam && (SETTING_CATEGORIES as readonly string[]).includes(categoryParam)
    ? (categoryParam as SettingCategory)
    : undefined

  const values = await getAllSettings(tenant.schoolId, category)

  const meta = (Object.keys(SETTINGS_REGISTRY) as SettingKey[])
    .filter((k) => !category || SETTINGS_REGISTRY[k].category === category)
    .map((k) => ({
      key: k,
      category: SETTINGS_REGISTRY[k].category,
      label: SETTINGS_REGISTRY[k].label,
      description: SETTINGS_REGISTRY[k].description ?? null,
      value: values[k],
      default: SETTINGS_REGISTRY[k].default,
    }))

  return NextResponse.json({ categories: SETTING_CATEGORIES, settings: meta })
}

/**
 * PUT /api/settings  body: { settings: { "grading.passMark": 50, ... } }
 * Admin-only. Validates each entry against the registry; valid entries are
 * persisted, invalid/unknown keys are reported back with a 207-style payload.
 */
export async function PUT(request: Request) {
  const auth = await validateRole(['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error
  const tenant = await getRequestTenant()
  if ('error' in tenant) return tenant.error

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const entries = (body as { settings?: Record<string, unknown> })?.settings
  if (!entries || typeof entries !== 'object') {
    return NextResponse.json({ error: 'Body must be { settings: { key: value } }' }, { status: 400 })
  }

  const result = await setSettings(tenant.schoolId, entries)

  if (result.updated.length > 0) {
    logAudit({
      action: 'UPDATE',
      entity: 'settings',
      entityId: tenant.schoolId,
      afterValue: { updated: result.updated },
    }).catch(() => {})
  }

  const status = result.errors.length > 0 ? (result.updated.length > 0 ? 207 : 400) : 200
  return NextResponse.json(result, { status })
}
