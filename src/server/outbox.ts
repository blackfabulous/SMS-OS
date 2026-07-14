import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { currentSchoolId } from '@/server/tenant-context'

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

export async function processOutbox(limit = 50) {
  const jobs = await db.outbox.findMany({
    where: { status: 'PENDING', scheduledAt: { lte: new Date() } },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  })

  for (const job of jobs) {
    try {
      await dispatchOutbox(job.topic, job.payload)
      await db.outbox.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', attempts: { increment: 1 } },
      })
    } catch (err) {
      const attempts = job.attempts + 1
      await db.outbox.update({
        where: { id: job.id },
        data: {
          status: attempts >= job.maxAttempts ? 'FAILED' : 'PENDING',
          attempts,
          error: String(err),
        },
      })
    }
  }
}

async function dispatchOutbox(topic: string, payload: unknown) {
  switch (topic) {
    case 'notify.guardian':
      // TODO: wire to notification service
      break
    default:
    // no-op — handlers are registered per topic
  }
}
