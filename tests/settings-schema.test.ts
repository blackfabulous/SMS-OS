import { describe, it, expect } from 'vitest'
import {
  getDefault,
  validateValue,
  parseStored,
  serialize,
  mergeWithDefaults,
  isSettingKey,
  keysForCategory,
  allDefaults,
  SETTING_KEYS,
} from '@/lib/settings-schema'

describe('settings registry — defaults', () => {
  it('exposes a default for every key', () => {
    for (const key of SETTING_KEYS) {
      expect(getDefault(key)).not.toBeUndefined()
    }
  })

  it('every default validates against its own schema', () => {
    for (const key of SETTING_KEYS) {
      expect(validateValue(key, getDefault(key)).ok).toBe(true)
    }
  })

  it('returns the ZIMSEC grading scale by default', () => {
    const scale = getDefault('grading.scale')
    expect(scale[0]).toEqual({ symbol: 'A', min: 75, max: 100, descriptor: 'Distinction' })
    expect(scale.at(-1)?.symbol).toBe('U')
  })
})

describe('isSettingKey', () => {
  it('accepts known keys and rejects unknown', () => {
    expect(isSettingKey('grading.passMark')).toBe(true)
    expect(isSettingKey('totally.madeup')).toBe(false)
  })
})

describe('validateValue', () => {
  it('accepts a valid pass mark', () => {
    expect(validateValue('grading.passMark', 60)).toEqual({ ok: true, value: 60 })
  })

  it('rejects an out-of-range pass mark', () => {
    const r = validateValue('grading.passMark', 150)
    expect(r.ok).toBe(false)
  })

  it('rejects an unknown currency', () => {
    expect(validateValue('finance.baseCurrency', 'GBP').ok).toBe(false)
  })

  it('rejects a malformed hex colour', () => {
    expect(validateValue('branding.primaryColor', 'green').ok).toBe(false)
    expect(validateValue('branding.primaryColor', '#10b981').ok).toBe(true)
  })

  it('validates array-of-enum settings', () => {
    expect(validateValue('finance.paymentMethods', ['ECOCASH', 'CASH']).ok).toBe(true)
    expect(validateValue('finance.paymentMethods', ['BITCOIN']).ok).toBe(false)
  })
})

describe('parseStored — resilient to corruption', () => {
  it('round-trips a valid serialized value', () => {
    const raw = serialize(70)
    expect(parseStored('grading.passMark', raw)).toBe(70)
  })

  it('falls back to default on malformed JSON', () => {
    expect(parseStored('grading.passMark', '{not json')).toBe(getDefault('grading.passMark'))
  })

  it('falls back to default on schema-invalid stored value', () => {
    expect(parseStored('grading.passMark', serialize(999))).toBe(getDefault('grading.passMark'))
  })

  it('falls back to default on null/undefined', () => {
    expect(parseStored('finance.baseCurrency', null)).toBe('USD')
    expect(parseStored('finance.baseCurrency', undefined)).toBe('USD')
  })
})

describe('mergeWithDefaults', () => {
  it('overlays stored values on top of defaults', () => {
    const merged = mergeWithDefaults({
      'grading.passMark': serialize(40),
      'finance.baseCurrency': serialize('ZWG'),
    })
    expect(merged['grading.passMark']).toBe(40)
    expect(merged['finance.baseCurrency']).toBe('ZWG')
    // untouched key keeps its default
    expect(merged['attendance.lockAfterDays']).toBe(getDefault('attendance.lockAfterDays'))
  })

  it('ignores a corrupted stored value and uses the default', () => {
    const merged = mergeWithDefaults({ 'grading.passMark': 'garbage' })
    expect(merged['grading.passMark']).toBe(getDefault('grading.passMark'))
  })
})

describe('keysForCategory', () => {
  it('groups keys by category', () => {
    const finance = keysForCategory('finance')
    expect(finance).toContain('finance.baseCurrency')
    expect(finance.every((k) => k.startsWith('finance.'))).toBe(true)
  })

  it('allDefaults covers exactly the registry keys', () => {
    expect(Object.keys(allDefaults()).sort()).toEqual([...SETTING_KEYS].sort())
  })
})
