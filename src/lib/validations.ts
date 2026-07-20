import { z } from 'zod'

// Shared request-body schemas. Kept deliberately permissive on free-text /
// enum-like fields (so values the existing UI already sends are not rejected)
// while still enforcing presence and type — raw request bodies must never reach
// Prisma unvalidated. Money fields are coerced so "100" and 100 both parse, then
// constrained to finite, positive/non-negative values.

const isFinite = (n: number) => Number.isFinite(n)

const requiredId = z.string().min(1, 'Required')
const optionalId = z.string().min(1).optional()
const positiveAmount = z.coerce.number().positive('Must be greater than 0').refine(isFinite, 'Must be a finite number')
const nonNegativeAmount = z.coerce.number().nonnegative('Cannot be negative').refine(isFinite, 'Must be a finite number')

export const CreatePaymentSchema = z.object({
  studentId: requiredId,
  invoiceId: optionalId,
  parentId: optionalId,
  amount: positiveAmount,
  paymentMethod: z.string().min(1).max(40).optional(),
  currency: z.string().min(1).max(10).optional(),
  exchangeRate: z.coerce.number().positive().refine(isFinite, 'Must be a finite number').optional(),
  reference: z.string().max(200).optional(),
})

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>

export const CreateInvoiceSchema = z.object({
  studentId: requiredId,
  termId: requiredId,
  dueDate: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1).max(300),
        amount: nonNegativeAmount,
        feeType: z.string().min(1).max(40),
      })
    )
    .min(1, 'At least one invoice item is required'),
})

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>

// Only the genuinely-required fields are validated; the route reads the many
// optional profile fields directly from the body afterwards.
export const CreateStudentSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1).max(20),
})

export const RunPayrollSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
})

export const SaveMarksSchema = z.object({
  marks: z
    .array(
      z.object({
        studentId: requiredId,
        marksObtained: nonNegativeAmount,
        grade: z.string().max(5).optional(),
        comments: z.string().max(500).optional(),
      })
    )
    .min(1, 'No marks provided'),
})
