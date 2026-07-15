import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { currentSchoolId } from '@/server/tenant-context'

export type OutboxHandler<T = unknown> = (payload: T) => Promise<unknown>

const handlers = new Map<string, OutboxHandler>()

export function registerOutboxHandler<T>(topic: string, handler: OutboxHandler<T>) {
  handlers.set(topic, handler as OutboxHandler)
}

export async function enqueueOutbox(params: {
  topic: string
  payload: unknown
  schoolId?: string | null
  scheduledAt?: Date
  maxAttempts?: number
}) {
  const schoolId = params.schoolId ?? currentSchoolId()
  return db.outbox.create({
    data: {
      schoolId,
      topic: params.topic,
      payload: params.payload as Prisma.InputJsonValue,
      scheduledAt: params.scheduledAt ?? new Date(),
      maxAttempts: params.maxAttempts ?? 3,
    },
  })
}

async function dispatchOutbox(topic: string, payload: unknown) {
  const handler = handlers.get(topic)
  if (!handler) {
    throw new Error(`No outbox handler registered for topic: ${topic}`)
  }
  return handler(payload)
}

/**
 * Process a single outbox job and return whatever the handler returned.
 * Updates status, attempts and error on the row. Idempotent: a COMPLETED job
 * simply re-returns undefined (no handler re-run).
 */
export async function processOutboxJob(id: string): Promise<unknown> {
  const job = await db.outbox.findUnique({ where: { id } })
  if (!job) throw new Error(`Outbox job not found: ${id}`)
  if (job.status === 'COMPLETED') return undefined
  if (job.status === 'FAILED') throw new Error(`Outbox job already failed: ${id} (${job.error ?? 'unknown'})`)

  await db.outbox.update({ where: { id }, data: { status: 'PROCESSING' } })

  try {
    const result = await dispatchOutbox(job.topic, job.payload)
    await db.outbox.update({
      where: { id },
      data: { status: 'COMPLETED', attempts: { increment: 1 }, error: null },
    })
    return result
  } catch (err) {
    const attempts = job.attempts + 1
    const status = attempts >= job.maxAttempts ? 'FAILED' : 'PENDING'
    await db.outbox.update({
      where: { id },
      data: { status, attempts, error: String(err) },
    })
    throw err
  }
}

export interface ProcessOptions {
  limit?: number
  topics?: string[]
}

/**
 * Poll pending outbox jobs and dispatch them. Call from a cron/edge worker or
 * an admin endpoint. Failed jobs are retried up to their maxAttempts.
 */
export async function processOutbox(options: ProcessOptions = {}) {
  const { limit = 50, topics } = options

  const where: any = {
    status: { in: ['PENDING', 'FAILED'] },
    scheduledAt: { lte: new Date() },
  }
  if (topics && topics.length > 0) {
    where.topic = { in: topics }
  }

  const jobs = await db.outbox.findMany({ where, orderBy: { scheduledAt: 'asc' }, take: limit })

  const results = await Promise.allSettled(
    jobs.map((job) =>
      processOutboxJob(job.id).catch((err) => {
        console.error(`[outbox] ${job.topic} failed:`, err)
        throw err
      })
    )
  )

  const completed = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  return { completed, failed, total: jobs.length }
}
