import { TenantContext } from "@/server/tenant";
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";
import { assertCan } from "@/server/policies";
import { queueAudit } from "@/server/audit";
import { SettingsRepository } from "./settings.repository";
import {
  CreateSettingInput,
  UpdateSettingInput,
  SettingKey,
  validateSettingValue,
} from "./settings.schema";

export function SettingsService(repo: SettingsRepository) {
  return {
    async get(ctx: TenantContext, key: SettingKey) {
      assertCan(ctx, "read", "settings");

      const setting = await repo.findByKey(ctx.schoolId, key);
      if (!setting) {
        throw new NotFoundError("Setting", key);
      }

      return {
        key: setting.key,
        value: setting.value,
        updatedById: setting.updatedById,
        updatedAt: setting.updatedAt,
      };
    },

    async list(ctx: TenantContext, keys?: SettingKey[]) {
      assertCan(ctx, "read", "settings");

      const settings = await repo.findMany(ctx.schoolId, keys);
      return settings.map((s) => ({
        key: s.key,
        value: s.value,
        updatedById: s.updatedById,
        updatedAt: s.updatedAt,
      }));
    },

    async create(ctx: TenantContext, input: CreateSettingInput) {
      assertCan(ctx, "update", "settings");

      if (!validateSettingValue(input.key, input.value)) {
        throw new ValidationError(`Invalid value for setting ${input.key}`);
      }

      const existing = await repo.findByKey(ctx.schoolId, input.key);
      if (existing) {
        throw new ValidationError(`Setting ${input.key} already exists`);
      }

      const created = await repo.create({
        schoolId: ctx.schoolId,
        key: input.key,
        value: input.value,
        updatedById: ctx.userId,
      });

      await queueAudit({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: "SETTINGS.CREATE",
        entity: "SchoolSetting",
        entityId: created.id,
        before: null,
        after: created.value,
      });

      return {
        key: created.key,
        value: created.value,
        updatedById: created.updatedById,
        updatedAt: created.updatedAt,
      };
    },

    async update(ctx: TenantContext, key: SettingKey, input: UpdateSettingInput) {
      assertCan(ctx, "update", "settings");

      if (!validateSettingValue(key, input.value)) {
        throw new ValidationError(`Invalid value for setting ${key}`);
      }

      const existing = await repo.findByKey(ctx.schoolId, key);
      if (!existing) {
        throw new NotFoundError("Setting", key);
      }

      const before = existing.value;

      const updated = await repo.update(ctx.schoolId, key, {
        value: input.value,
        updatedById: ctx.userId,
      });

      await queueAudit({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: "SETTINGS.UPDATE",
        entity: "SchoolSetting",
        entityId: updated.id,
        before,
        after: updated.value,
      });

      return {
        key: updated.key,
        value: updated.value,
        updatedById: updated.updatedById,
        updatedAt: updated.updatedAt,
      };
    },

    async upsert(ctx: TenantContext, key: SettingKey, input: UpdateSettingInput) {
      assertCan(ctx, "update", "settings");

      if (!validateSettingValue(key, input.value)) {
        throw new ValidationError(`Invalid value for setting ${key}`);
      }

      const existing = await repo.findByKey(ctx.schoolId, key);
      const before = existing?.value ?? null;

      const updated = await repo.upsert(ctx.schoolId, key, {
        value: input.value,
        updatedById: ctx.userId,
      });

      await queueAudit({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: existing ? "SETTINGS.UPDATE" : "SETTINGS.CREATE",
        entity: "SchoolSetting",
        entityId: updated.id,
        before,
        after: updated.value,
      });

      return {
        key: updated.key,
        value: updated.value,
        updatedById: updated.updatedById,
        updatedAt: updated.updatedAt,
      };
    },

    async delete(ctx: TenantContext, key: SettingKey) {
      assertCan(ctx, "delete", "settings");

      const existing = await repo.findByKey(ctx.schoolId, key);
      if (!existing) {
        throw new NotFoundError("Setting", key);
      }

      const deleted = await repo.delete(ctx.schoolId, key, ctx.userId);

      await queueAudit({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: "SETTINGS.DELETE",
        entity: "SchoolSetting",
        entityId: deleted.id,
        before: deleted.value,
        after: null,
      });

      return { key, deletedAt: deleted.deletedAt };
    },
  };
}

export type SettingsService = ReturnType<typeof SettingsService>;
