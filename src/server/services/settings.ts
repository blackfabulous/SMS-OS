import 'server-only'
import { db } from '@/lib/db'
import {
  type SettingKey,
  type SettingValue,
  type SettingCategory,
  SETTINGS_REGISTRY,
  getDefault,
  validateValue,
  serialize,
  parseStored,
  mergeWithDefaults,
  isSettingKey,
} from '@/lib/settings-schema'

/**
 * DB-backed accessor for the per-school settings registry. Pure shape/validation
 * logic lives in `settings-schema.ts`; this module only handles persistence.
 */

/** Fetch a single typed setting (falls back to the registry default). */
export async function getSetting<K extends SettingKey>(schoolId: string, key: K): Promise<SettingValue<K>> {
  const row = await db.schoolSetting.findUnique({
    where: { schoolId_key: { schoolId, key } },
    select: { value: true },
  })
  return parseStored(key, row?.value)
}

/** Fetch every setting for a school, merged over defaults (optionally one category). */
export async function getAllSettings(
  schoolId: string,
  category?: SettingCategory,
): Promise<{ [K in SettingKey]: SettingValue<K> }> {
  const rows = await db.schoolSetting.findMany({
    where: { schoolId, ...(category ? { category } : {}) },
    select: { key: true, value: true },
  })
  const stored: Partial<Record<SettingKey, string>> = {}
  for (const r of rows) {
    if (isSettingKey(r.key)) stored[r.key] = r.value
  }
  return mergeWithDefaults(stored)
}

/** Persist a single setting after validating it against the registry. */
export async function setSetting<K extends SettingKey>(schoolId: string, key: K, value: unknown): Promise<void> {
  const validated = validateValue(key, value)
  if (!validated.ok) throw new SettingValidationError(key, validated.error)
  const category = SETTINGS_REGISTRY[key].category
  await db.schoolSetting.upsert({
    where: { schoolId_key: { schoolId, key } },
    create: { schoolId, key, category, value: serialize(validated.value) },
    update: { category, value: serialize(validated.value) },
  })
}

export interface SetSettingsResult {
  updated: SettingKey[]
  errors: { key: string; error: string }[]
}

/**
 * Batch upsert. Unknown keys and validation failures are collected as errors;
 * valid entries are written in a single transaction (all-or-nothing on the
 * valid subset). Returns which keys updated and which were rejected.
 */
export async function setSettings(
  schoolId: string,
  entries: Record<string, unknown>,
): Promise<SetSettingsResult> {
  const errors: { key: string; error: string }[] = []
  const ops: { key: SettingKey; category: SettingCategory; value: string }[] = []

  for (const [key, value] of Object.entries(entries)) {
    if (!isSettingKey(key)) {
      errors.push({ key, error: 'Unknown setting key' })
      continue
    }
    const validated = validateValue(key, value)
    if (!validated.ok) {
      errors.push({ key, error: validated.error })
      continue
    }
    ops.push({ key, category: SETTINGS_REGISTRY[key].category, value: serialize(validated.value) })
  }

  if (ops.length > 0) {
    await db.$transaction(
      ops.map((o) =>
        db.schoolSetting.upsert({
          where: { schoolId_key: { schoolId, key: o.key } },
          create: { schoolId, key: o.key, category: o.category, value: o.value },
          update: { category: o.category, value: o.value },
        }),
      ),
    )
  }

  return { updated: ops.map((o) => o.key), errors }
}

export class SettingValidationError extends Error {
  constructor(public key: string, public reason: string) {
    super(`Invalid value for "${key}": ${reason}`)
    this.name = 'SettingValidationError'
  }
}

// Re-export default helper for server consumers that only need a fallback.
export { getDefault }
