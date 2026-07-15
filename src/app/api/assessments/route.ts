import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ok, fail } from '@/server/http'
import { validateRole } from '@/lib/api-auth'
import { getRequestTenant } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    const tenantResult = await getRequestTenant()
    if ('error' in tenantResult) return tenantResult.error
    const { schoolId } = tenantResult

    const { searchParams } = new URL(request.url)
    const assessmentType = searchParams.get('assessmentType')
    const subjectId = searchParams.get('subjectId')
    const classId = searchParams.get('classId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Always scope to authenticated user's school
    const where: Record<string, unknown> = { schoolId }
    if (assessmentType) where.assessmentType = assessmentType
    if (subjectId) where.subjectId = subjectId
    if (classId) where.classId = classId

    const [assessments, total] = await Promise.all([
      db.assessment.findMany({
        where,
        include: {
          subject: true,
          marks: {
            include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.assessment.count({ where }),
    ])

    return ok({ data: assessments, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching assessments')
    return fail('INTERNAL', 'Failed to fetch assessments')
  }
}

export async function POST(request: Request) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()

    // Use session schoolId — never trust body.schoolId
    const currentTerm = await db.term.findFirst({
      where: { academicYear: { schoolId: session.user.schoolId }, isCurrent: true },
      orderBy: { createdAt: 'desc' },
    })

    const assessment = await db.assessment.create({
      data: {
        schoolId: session.user.schoolId,
        termId: currentTerm?.id || body.termId || '',
        subjectId: body.subjectId,
        classId: body.classId || null,
        name: body.name,
        assessmentType: body.assessmentType || 'TEST',
        totalMarks: body.totalMarks || 100,
        weight: body.weight || 1,
        date: body.date ? new Date(body.date) : undefined,
        isLocked: false,
      },
      include: { subject: true, marks: true },
    })

    if (body.marks && Array.isArray(body.marks) && body.marks.length > 0) {
      await db.assessmentMark.createMany({
        data: body.marks.map((mark: { studentId: string; marksObtained: number; grade?: string; comments?: string }) => ({
          assessmentId: assessment.id,
          studentId: mark.studentId,
          marksObtained: mark.marksObtained,
          grade: mark.grade,
          comments: mark.comments,
        })),
        skipDuplicates: true,
      })
    }

    logAudit({ action: 'CREATE', entity: 'assessments', entityId: assessment.id, afterValue: assessment }).catch(() => {})
    return ok(assessment, 201)
  } catch (error) {
    logger.error({ err: error }, 'Error creating assessment')
    return fail('INTERNAL', 'Failed to create assessment')
  }
}

export async function PUT(request: Request) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return fail('VALIDATION', 'Assessment ID is required')

    // Verify assessment belongs to caller's school
    const existing = await db.assessment.findUnique({
      where: { id, schoolId: session.user.schoolId },
      select: { id: true },
    })
    if (!existing) return fail('NOT_FOUND', 'Assessment not found')

    const assessment = await db.assessment.update({
      where: { id },
      data: {
        name: updates.name,
        assessmentType: updates.assessmentType,
        totalMarks: updates.totalMarks,
        weight: updates.weight,
        date: updates.date ? new Date(updates.date) : undefined,
        isLocked: updates.isLocked,
      },
      include: { subject: true, marks: true },
    })

    logAudit({ action: 'UPDATE', entity: 'assessments', entityId: assessment.id, afterValue: assessment }).catch(() => {})
    return ok(assessment)
  } catch (error) {
    logger.error({ err: error }, 'Error updating assessment')
    return fail('INTERNAL', 'Failed to update assessment')
  }
}

export async function DELETE(request: Request) {
  const authResult = await validateRole(['ADMIN', 'TEACHER'])
  if ('error' in authResult) return authResult.error
  const { session } = authResult

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return fail('VALIDATION', 'Assessment ID is required')

    // Verify assessment belongs to caller's school
    const existing = await db.assessment.findUnique({
      where: { id, schoolId: session.user.schoolId },
      select: { id: true },
    })
    if (!existing) return fail('NOT_FOUND', 'Assessment not found')

    await db.assessmentMark.deleteMany({ where: { assessmentId: id } })
    await db.assessment.delete({ where: { id } })

    logAudit({ action: 'DELETE', entity: 'assessments', entityId: id }).catch(() => {})
    return ok({ message: 'Assessment deleted successfully' })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting assessment')
    return fail('INTERNAL', 'Failed to delete assessment')
  }
}
