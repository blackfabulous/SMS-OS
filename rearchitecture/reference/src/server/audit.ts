import { prisma } from "@/server/db/prisma";
import { toJsonInput } from "@/lib/json";
import { Prisma } from "@prisma/client";

type AuditAction = `${string}.${"CREATE" | "UPDATE" | "DELETE" | "READ"}`;

interface AuditPayload {
  schoolId: string;
  actorId: string | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  before: unknown;
  after: unknown;
  metadata?: Record<string, unknown>;
}

export async function queueAudit(payload: AuditPayload) {
  await prisma.outbox.create({
    data: {
      schoolId: payload.schoolId,
      type: "AUDIT_LOG",
      payload: toJsonInput(payload) as Prisma.InputJsonValue,
      status: "PENDING",
      processAfter: new Date(),
    },
  });
}

export async function writeAudit(payload: AuditPayload) {
  await prisma.auditLog.create({
    data: {
      schoolId: payload.schoolId,
      actorId: payload.actorId,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId,
      before: toJsonInput(payload.before),
      after: toJsonInput(payload.after),
      metadata: toJsonInput(payload.metadata),
    },
  });
}
