import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { requireContext } from '@/server/context'
import { financeStudentScope } from '@/server/finance/scope'
import { CreateInvoiceSchema } from '@/lib/validations'
import { listInvoices, createInvoice, updateInvoice, deleteInvoice, handleFinanceError } from '@/server/services/finance'

export async function GET(request: NextRequest) {
  const result = await requireContext()
  if ('error' in result) return result.error

  try {
    const scope = await financeStudentScope(result.ctx)
    if (!scope) return ok({ data: [], total: 0, page: 1, totalPages: 0 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const studentId = searchParams.get('studentId') || ''
    const termId = searchParams.get('termId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const data = await listInvoices(result.ctx.schoolId, scope, { status, studentId, termId, page, limit })
    return ok(data)
  } catch (error) {
    const { code, message } = handleFinanceError(error, 'Failed to fetch invoices')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireContext({ roles: ['ADMIN', 'BURSAR'] })
  if ('error' in authResult) return authResult.error

  try {
    const rawBody = await request.json()
    const parsed = CreateInvoiceSchema.safeParse(rawBody)
    if (!parsed.success) return fail('VALIDATION', 'Validation failed', { details: parsed.error.issues })

    const invoice = await createInvoice(authResult.ctx.schoolId, parsed.data)
    return ok(invoice, 201)
  } catch (error) {
    const { code, message } = handleFinanceError(error, 'Failed to create invoice')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireContext({ roles: ['ADMIN', 'BURSAR'] })
  if ('error' in authResult) return authResult.error

  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return fail('VALIDATION', 'Invoice ID is required')

    const invoice = await updateInvoice(authResult.ctx.schoolId, id, updates)
    return ok(invoice)
  } catch (error) {
    const { code, message } = handleFinanceError(error, 'Failed to update invoice')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireContext({ roles: ['ADMIN', 'BURSAR'] })
  if ('error' in authResult) return authResult.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return fail('VALIDATION', 'Invoice ID is required')

    const result = await deleteInvoice(authResult.ctx.schoolId, id)
    return ok(result)
  } catch (error) {
    const { code, message } = handleFinanceError(error, 'Failed to delete invoice')
    if (code === 'INTERNAL') logger.error({ err: error }, message)
    return fail(code, message)
  }
}
