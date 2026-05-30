import { z } from 'zod'

/**
 * Central registry of all configurable school settings.
 *
 * This module is PURE (no DB, no `server-only`) so it can be unit-tested and
 * imported by both client and server. Each entry declares a Zod schema (for
 * validation + type inference), a sane default, a category and a human label.
 *
 * Values are persisted JSON-encoded in the `SchoolSetting` table keyed by
 * `key`; the registry is the single source of truth for shape + defaults.
 */

export const SETTING_CATEGORIES = [
  'academic',
  'grading',
  'finance',
  'attendance',
  'notifications',
  'branding',
] as const
export type SettingCategory = (typeof SETTING_CATEGORIES)[number]

const gradeBand = z.object({
  symbol: z.string().min(1).max(4),
  min: z.number().min(0).max(100),
  max: z.number().min(0).max(100),
  descriptor: z.string().min(1).max(40),
})

export const CURRENCIES = ['USD', 'ZWG'] as const
export const PAYMENT_METHODS = ['CASH', 'ECOCASH', 'ONEMONEY', 'INNBUCKS', 'ZIMSWITCH', 'BANK_TRANSFER'] as const
export const NOTIFICATION_CHANNELS = ['SMS', 'EMAIL', 'WHATSAPP', 'IN_APP'] as const

interface SettingDefBase<T> {
  category: SettingCategory
  label: string
  description?: string
  schema: z.ZodType<T>
  default: T
}

/** Helper to keep each entry's value type inferred from its schema. */
function def<T>(d: SettingDefBase<T>): SettingDefBase<T> {
  return d
}

export const SETTINGS_REGISTRY = {
  // ─── Academic ──────────────────────────────────────────────────────────
  'academic.currentYear': def({
    category: 'academic',
    label: 'Current academic year',
    schema: z.string().regex(/^\d{4}$/, 'Must be a 4-digit year'),
    default: '2025',
  }),
  'academic.termStructure': def({
    category: 'academic',
    label: 'Term structure',
    schema: z.enum(['3-term', '2-semester']),
    default: '3-term',
  }),
  'academic.yearStartMonth': def({
    category: 'academic',
    label: 'Academic year start month',
    schema: z.number().int().min(1).max(12),
    default: 1,
  }),

  // ─── Grading (ZIMSEC) ──────────────────────────────────────────────────
  'grading.passMark': def({
    category: 'grading',
    label: 'Pass mark (%)',
    schema: z.number().min(0).max(100),
    default: 50,
  }),
  'grading.scale': def({
    category: 'grading',
    label: 'Grading scale',
    description: 'Symbol bands applied to a percentage mark.',
    schema: z.array(gradeBand).min(1),
    default: [
      { symbol: 'A', min: 75, max: 100, descriptor: 'Distinction' },
      { symbol: 'B', min: 65, max: 74, descriptor: 'Merit' },
      { symbol: 'C', min: 50, max: 64, descriptor: 'Credit' },
      { symbol: 'D', min: 40, max: 49, descriptor: 'Pass' },
      { symbol: 'E', min: 30, max: 39, descriptor: 'Weak Pass' },
      { symbol: 'U', min: 0, max: 29, descriptor: 'Ungraded' },
    ],
  }),
  'grading.continuousAssessmentWeight': def({
    category: 'grading',
    label: 'Continuous assessment weight (%)',
    description: 'CA contribution to the final mark; the exam takes the remainder.',
    schema: z.number().min(0).max(100),
    default: 30,
  }),

  // ─── Finance ───────────────────────────────────────────────────────────
  'finance.baseCurrency': def({
    category: 'finance',
    label: 'Base currency',
    schema: z.enum(CURRENCIES),
    default: 'USD',
  }),
  'finance.acceptedCurrencies': def({
    category: 'finance',
    label: 'Accepted currencies',
    schema: z.array(z.enum(CURRENCIES)).min(1),
    default: ['USD', 'ZWG'],
  }),
  'finance.paymentMethods': def({
    category: 'finance',
    label: 'Accepted payment methods',
    schema: z.array(z.enum(PAYMENT_METHODS)).min(1),
    default: ['CASH', 'ECOCASH', 'ONEMONEY', 'INNBUCKS', 'ZIMSWITCH', 'BANK_TRANSFER'],
  }),
  'finance.lateFeePenaltyPct': def({
    category: 'finance',
    label: 'Late fee penalty (%)',
    schema: z.number().min(0).max(100),
    default: 0,
  }),

  // ─── Attendance ────────────────────────────────────────────────────────
  'attendance.lockAfterDays': def({
    category: 'attendance',
    label: 'Lock registers after (days)',
    description: 'Attendance can no longer be edited this many days after the date.',
    schema: z.number().int().min(0).max(90),
    default: 7,
  }),

  // ─── Notifications ─────────────────────────────────────────────────────
  'notifications.channels': def({
    category: 'notifications',
    label: 'Enabled notification channels',
    schema: z.array(z.enum(NOTIFICATION_CHANNELS)).min(0),
    default: ['SMS', 'EMAIL'],
  }),
  'notifications.feeRemindersEnabled': def({
    category: 'notifications',
    label: 'Send fee reminders',
    schema: z.boolean(),
    default: true,
  }),

  // ─── Branding ──────────────────────────────────────────────────────────
  'branding.primaryColor': def({
    category: 'branding',
    label: 'Primary brand colour',
    schema: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Must be a 6-digit hex colour'),
    default: '#059669',
  }),
} as const

export type SettingKey = keyof typeof SETTINGS_REGISTRY
export type SettingValue<K extends SettingKey> = z.infer<(typeof SETTINGS_REGISTRY)[K]['schema']>

export const SETTING_KEYS = Object.keys(SETTINGS_REGISTRY) as SettingKey[]

export function isSettingKey(key: string): key is SettingKey {
  return Object.prototype.hasOwnProperty.call(SETTINGS_REGISTRY, key)
}

export function getSettingDef<K extends SettingKey>(key: K) {
  return SETTINGS_REGISTRY[key]
}

export function getDefault<K extends SettingKey>(key: K): SettingValue<K> {
  return SETTINGS_REGISTRY[key].default as SettingValue<K>
}

/** Validate an already-parsed value against the registry schema. */
export function validateValue<K extends SettingKey>(
  key: K,
  value: unknown,
): { ok: true; value: SettingValue<K> } | { ok: false; error: string } {
  const result = SETTINGS_REGISTRY[key].schema.safeParse(value)
  if (result.success) return { ok: true, value: result.data as SettingValue<K> }
  return { ok: false, error: result.error.issues.map((i) => i.message).join('; ') }
}

export function serialize(value: unknown): string {
  return JSON.stringify(value)
}

/**
 * Parse a stored JSON string for a key, validating it. Falls back to the
 * default if the key is unknown, the JSON is malformed, or validation fails —
 * so a corrupted row can never crash a consumer.
 */
export function parseStored<K extends SettingKey>(key: K, raw: string | null | undefined): SettingValue<K> {
  if (raw == null) return getDefault(key)
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return getDefault(key)
  }
  const validated = validateValue(key, parsed)
  return validated.ok ? validated.value : getDefault(key)
}

/** All defaults as a typed map. */
export function allDefaults(): { [K in SettingKey]: SettingValue<K> } {
  // Use a permissive intermediate: indexing a mapped type with a union key
  // narrows the value to `never`, so we build on Record<…, unknown> and cast.
  const out = {} as Record<SettingKey, unknown>
  for (const key of SETTING_KEYS) {
    out[key] = getDefault(key)
  }
  return out as { [K in SettingKey]: SettingValue<K> }
}

/** Merge a map of stored raw JSON strings over the defaults, validating each. */
export function mergeWithDefaults(
  stored: Partial<Record<SettingKey, string>>,
): { [K in SettingKey]: SettingValue<K> } {
  const out = allDefaults() as Record<SettingKey, unknown>
  for (const key of SETTING_KEYS) {
    const raw = stored[key]
    if (raw !== undefined) out[key] = parseStored(key, raw)
  }
  return out as { [K in SettingKey]: SettingValue<K> }
}

export function keysForCategory(category: SettingCategory): SettingKey[] {
  return SETTING_KEYS.filter((k) => SETTINGS_REGISTRY[k].category === category)
}
