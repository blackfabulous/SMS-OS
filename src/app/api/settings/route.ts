import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
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
  const result = await requireContext({ module: 'settings', action: 'read' })
  if ('error' in result) return result.error
  const { ctx } = result

  const { searchParams } = new URL(request.url)
  const categoryParam = searchParams.get('category')
  const category = categoryParam && (SETTING_CATEGORIES as readonly string[]).includes(categoryParam)
    ? (categoryParam as SettingCategory)
    : undefined

  try {
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

    return ok({ categories: SETTING_CATEGORIES, settings: meta })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching settings')
    return fail('INTERNAL', 'Failed to fetch settings')
  }
}

/**
 * PUT /api/settings  body: { settings: { "grading.passMark": 50, ... } }
 * Admin-only. Validates each entry against the registry; valid entries are
 * persisted, invalid/unknown keys are reported back with a 207-style payload.
 */
export async function PUT(request: Request) {
  const result = await requireContext({ roles: ['ADMIN', 'SUPER_ADMIN'], module: 'settings', action: 'update' })
  if ('error' in result) return result.error
  const { ctx } = result

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('VALIDATION', 'Invalid JSON body')
  }

  const entries = (body as { settings?: Record<string, unknown> })?.settings
  if (!entries || typeof entries !== 'object') {
    return fail('VALIDATION', 'Body must be { settings: { key: value } }')
  }

  try {
    const outcome = await setSettings(ctx.schoolId, entries)

    if (outcome.updated.length > 0) {
      logAudit({
        action: 'UPDATE',
        entity: 'settings',
        entityId: ctx.schoolId,
        schoolId: ctx.schoolId,
        afterValue: { updated: outcome.updated },
      }).catch(() => {})
    }

    // 207 Multi-Status when some keys were rejected so the UI can surface
    // per-field validation errors without treating the whole request as a failure.
    const status = outcome.errors.length > 0 ? 207 : 200
    return ok(outcome, status)
  } catch (error) {
    logger.error({ err: error }, 'Error saving settings')
    return fail('INTERNAL', 'Failed to save settings')
  }
}
