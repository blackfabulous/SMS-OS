import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { z } from 'zod'
import { submitApplication, handleAdmissionsError } from '@/server/services/admissions'

const ApplySchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  middleName: z.string().max(80).optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE']),
  dateOfBirth: z.string().min(1),
  gradeApplyingFor: z.string().min(1).max(60),
  boardingStatus: z.enum(['DAY_SCHOLAR', 'BOARDER']).optional().or(z.literal('')),
  previousSchool: z.string().max(160).optional().or(z.literal('')),
  guardianFirstName: z.string().min(1).max(80),
  guardianLastName: z.string().min(1).max(80),
  guardianPhone: z.string().min(6).max(30),
  guardianEmail: z.string().email().optional().or(z.literal('')),
  guardianRelationship: z.string().max(40).optional().or(z.literal('')),
  message: z.string().max(1000).optional().or(z.literal('')),
  company: z.string().optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('VALIDATION', 'Invalid request body')
  }

  const parsed = ApplySchema.safeParse(body)
  if (!parsed.success) {
    return fail('VALIDATION', 'Please check the form and try again.', { details: parsed.error.issues })
  }
  const d = parsed.data

  if (d.company) {
    return ok({ message: 'Application received', reference: 'APP-OK' }, 201)
  }

  try {
    const result = await submitApplication(d)
    return ok(result, 201)
  } catch (error) {
    const { code, message } = handleAdmissionsError(error, 'Something went wrong submitting your application. Please try again later.')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
