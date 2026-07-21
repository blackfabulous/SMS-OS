import { MAX_SMS_LENGTH, recipientGroups } from './sms-constants'
import type { RecipientGroup } from './sms-types'

export function normalizePhones(individualPhones: string): string[] {
  return individualPhones
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => (p.startsWith('+') ? p : `+263${p}`))
}

export function buildPhoneNumbers(recipientGroupId: string, individualPhones: string, selectedGroup?: RecipientGroup): string[] {
  if (recipientGroupId === 'individual' && individualPhones) {
    return normalizePhones(individualPhones)
  }
  const count = selectedGroup?.count || 1
  const phones: string[] = []
  for (let i = 0; i < Math.min(count, 5); i++) {
    phones.push(`+26377${Math.floor(1000000 + Math.random() * 9000000)}`)
  }
  return phones
}

export function computeSmsMetrics(message: string, recipientCount: number) {
  const charCount = message.length
  const smsCount = Math.ceil(charCount / MAX_SMS_LENGTH) || (charCount > 0 ? 1 : 0)
  const isOverLimit = charCount > MAX_SMS_LENGTH * 5
  const estimatedCost = (smsCount * 0.02 * recipientCount).toFixed(2)
  return { charCount, smsCount, isOverLimit, estimatedCost }
}

export function getRecipientCount(recipientGroupId: string, individualPhones: string, selectedGroup?: RecipientGroup) {
  if (recipientGroupId === 'individual') {
    return normalizePhones(individualPhones).length || 0
  }
  return selectedGroup?.count || 0
}
