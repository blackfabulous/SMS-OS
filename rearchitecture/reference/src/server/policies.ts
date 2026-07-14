import { Role } from "@prisma/client";
import { AuthContext } from "@/server/tenant";
import { ForbiddenError } from "@/lib/errors";

export type Action = "create" | "read" | "update" | "delete" | "manage";

const roleHierarchy: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  FINANCE: 60,
  OPERATIONS: 60,
  TEACHER: 40,
  PARENT: 20,
  STUDENT: 10,
};

const policyMatrix: Record<string, Record<string, Role[]>> = {
  settings: {
    read: ["SUPER_ADMIN", "ADMIN", "FINANCE", "OPERATIONS", "TEACHER"],
    update: ["SUPER_ADMIN", "ADMIN"],
    manage: ["SUPER_ADMIN"],
  },
  // Add more resources here as contexts are migrated.
};

function roleMeetsRequirement(role: Role, required: Role[]): boolean {
  // Exact role or SUPER_ADMIN can override
  if (role === "SUPER_ADMIN") return true;
  return required.includes(role);
}

export function can(ctx: AuthContext, action: Action, resource: string): boolean {
  const resourcePolicies = policyMatrix[resource];
  if (!resourcePolicies) return false;

  const allowed = resourcePolicies[action] ?? resourcePolicies["manage"];
  if (!allowed) return false;

  return roleMeetsRequirement(ctx.role, allowed as Role[]);
}

export function assertCan(ctx: AuthContext, action: Action, resource: string) {
  if (!can(ctx, action, resource)) {
    throw new ForbiddenError(`${ctx.role} cannot ${action} ${resource}`);
  }
}

export function createTenantContext(ctx: AuthContext) {
  return {
    ...ctx,
    can: (action: Action, resource: string) => can(ctx, action, resource),
  };
}
