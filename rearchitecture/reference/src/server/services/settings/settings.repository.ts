import { prisma } from "@/server/db/prisma";
import { Prisma } from "@prisma/client";
import { tenantBase } from "@/server/tenant";
import { toJsonInput } from "@/lib/json";

export type SettingCreateInput = {
  schoolId: string;
  key: string;
  value: unknown;
  updatedById?: string | null;
};

export type SettingUpdateInput = {
  value: unknown;
  updatedById?: string | null;
};

export function SettingsRepository(tx: typeof prisma = prisma) {
  return {
    async findByKey(schoolId: string, key: string) {
      return tx.schoolSetting.findFirst({
        where: {
          ...tenantBase(schoolId),
          key,
        },
      });
    },

    async findMany(schoolId: string, keys?: string[]) {
      return tx.schoolSetting.findMany({
        where: {
          ...tenantBase(schoolId),
          ...(keys ? { key: { in: keys } } : {}),
        },
        orderBy: { key: "asc" },
      });
    },

    async upsert(schoolId: string, key: string, input: SettingUpdateInput) {
      return tx.schoolSetting.upsert({
        where: {
          schoolId_key: {
            schoolId,
            key,
          },
        },
        create: {
          schoolId,
          key,
          value: toJsonInput(input.value) as Prisma.InputJsonValue,
          updatedById: input.updatedById,
        },
        update: {
          value: toJsonInput(input.value) as Prisma.InputJsonValue,
          updatedById: input.updatedById,
        },
      });
    },

    async create(data: SettingCreateInput) {
      return tx.schoolSetting.create({
        data: {
          schoolId: data.schoolId,
          key: data.key,
          value: toJsonInput(data.value) as Prisma.InputJsonValue,
          updatedById: data.updatedById,
        },
      });
    },

    async update(schoolId: string, key: string, input: SettingUpdateInput) {
      return tx.schoolSetting.update({
        where: {
          schoolId_key: {
            schoolId,
            key,
          },
        },
        data: {
          value: toJsonInput(input.value) as Prisma.InputJsonValue,
          updatedById: input.updatedById,
        },
      });
    },

    async delete(schoolId: string, key: string, updatedById: string | null) {
      return tx.schoolSetting.update({
        where: {
          schoolId_key: {
            schoolId,
            key,
          },
        },
        data: {
          deletedAt: new Date(),
          updatedById,
        },
      });
    },
  };
}

export type SettingsRepository = ReturnType<typeof SettingsRepository>;
