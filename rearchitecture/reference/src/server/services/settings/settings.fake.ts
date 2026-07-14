import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { SettingsRepository } from "./settings.repository";

export type FakeSetting = {
  id: string;
  schoolId: string;
  key: string;
  value: Prisma.JsonValue;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export function createFakeRepo(): SettingsRepository {
  const settings = new Map<string, FakeSetting>();

  return {
    findByKey: async (schoolId, key) => {
      const s = settings.get(`${schoolId}:${key}`);
      return s ?? null;
    },
    findMany: async (schoolId, keys) => {
      const all = Array.from(settings.values()).filter((s) => s.schoolId === schoolId && s.deletedAt === null);
      return keys ? all.filter((s) => keys.includes(s.key)) : all;
    },
    upsert: async (schoolId, key, input) => {
      const existing = settings.get(`${schoolId}:${key}`);
      const id = existing?.id ?? crypto.randomUUID();
      const record: FakeSetting = {
        id,
        schoolId,
        key,
        value: input.value as Prisma.JsonValue,
        updatedById: input.updatedById ?? null,
        createdAt: existing?.createdAt ?? new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      settings.set(`${schoolId}:${key}`, record);
      return record;
    },
    create: async (data) => {
      const id = crypto.randomUUID();
      const record: FakeSetting = {
        id,
        schoolId: data.schoolId,
        key: data.key,
        value: data.value as Prisma.JsonValue,
        updatedById: data.updatedById ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      settings.set(`${data.schoolId}:${data.key}`, record);
      return record;
    },
    update: async (schoolId, key, input) => {
      const existing = settings.get(`${schoolId}:${key}`);
      if (!existing) throw new Error("Not found");
      const record: FakeSetting = {
        ...existing,
        value: input.value as Prisma.JsonValue,
        updatedById: input.updatedById ?? existing.updatedById,
        updatedAt: new Date(),
      };
      settings.set(`${schoolId}:${key}`, record);
      return record;
    },
    delete: async (schoolId, key, updatedById) => {
      const existing = settings.get(`${schoolId}:${key}`);
      if (!existing) throw new Error("Not found");
      const record: FakeSetting = { ...existing, deletedAt: new Date(), updatedById };
      settings.set(`${schoolId}:${key}`, record);
      return record;
    },
  };
}
