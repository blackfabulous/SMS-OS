import 'server-only'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { withSchoolId, whereSchoolId } from './tenant-scope'
import { applyPayment, reversePayment } from '@/lib/finance-calc'

const paymentInclude: Prisma.FeePaymentInclude = {
  student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
  parent: { select: { id: true, firstName: true, lastName: true } },
  invoice: { select: { id: true, invoiceNumber: true } },
}

export type PaymentWithRelations = Prisma.FeePaymentGetPayload<{ include: typeof paymentInclude }> & {
  // The Prisma client extension (src/lib/db.ts) converts Decimal money fields
  // to numbers for the app layer. This type override reflects the runtime shape.
  amount: number
}

export async function createPayment(
  schoolId: string,
  data: Omit<Prisma.FeePaymentUncheckedCreateInput, 'schoolId'>,
  baseAmount?: number,
): Promise<PaymentWithRelations> {
  return db.$transaction(async (tx) => {
    const createData = withSchoolId(data, schoolId) as Prisma.FeePaymentUncheckedCreateInput
    const newPayment = (await tx.feePayment.create({
      data: createData,
      include: paymentInclude,
    })) as unknown as PaymentWithRelations

    if (data.invoiceId && baseAmount !== undefined) {
      const invoice = await tx.feeInvoice.findUnique({
        where: { id: data.invoiceId, schoolId },
      })
      if (invoice) {
        await tx.feeInvoice.update({
          where: { id: data.invoiceId },
          data: applyPayment(invoice, baseAmount),
        })
        await tx.paymentAllocation.create({
          data: {
            paymentId: newPayment.id,
            invoiceId: invoice.id,
            schoolId,
            amount: baseAmount,
          },
        })
      }
    }

    return newPayment
  })
}

export async function findPayment(schoolId: string, id: string): Promise<PaymentWithRelations | null> {
  return db.feePayment.findFirst({
    where: whereSchoolId(schoolId, { id }) as Prisma.FeePaymentWhereInput,
    include: paymentInclude,
  }) as unknown as Promise<PaymentWithRelations | null>
}

export interface ListPaymentsOptions {
  where?: Prisma.FeePaymentWhereInput
  orderBy?: Prisma.FeePaymentOrderByWithRelationInput | Prisma.FeePaymentOrderByWithRelationInput[]
  skip?: number
  take?: number
}

export async function listPayments(schoolId: string, options: ListPaymentsOptions = {}) {
  const { where, orderBy, skip, take } = options
  const baseWhere = whereSchoolId(schoolId, where as Record<string, unknown>) as Prisma.FeePaymentWhereInput
  const [data, total] = await Promise.all([
    db.feePayment.findMany({
      where: baseWhere,
      orderBy,
      skip,
      take,
      include: paymentInclude,
    }),
    db.feePayment.count({ where: baseWhere }),
  ])
  return {
    data: data as unknown as PaymentWithRelations[],
    total,
  }
}

export async function reversePaymentById(schoolId: string, id: string): Promise<PaymentWithRelations> {
  return db.$transaction(async (tx) => {
    const payment = await tx.feePayment.update({
      where: { id },
      data: { isReversed: true },
    })

    if (payment.invoiceId) {
      const invoice = await tx.feeInvoice.findUnique({
        where: { id: payment.invoiceId, schoolId },
      })
      if (invoice) {
        const allocations = await tx.paymentAllocation.findMany({
          where: { paymentId: id, schoolId },
          select: { amount: true },
        })
        const allocated = allocations.reduce((sum, a) => sum + Number(a.amount), 0)
        await tx.paymentAllocation.deleteMany({ where: { paymentId: id, schoolId } })
        await tx.feeInvoice.update({
          where: { id: payment.invoiceId },
          data: reversePayment(invoice, allocated),
        })
      }
    }

    return tx.feePayment.findFirst({
      where: { id, schoolId },
      include: paymentInclude,
    }) as unknown as Promise<PaymentWithRelations>
  })
}
