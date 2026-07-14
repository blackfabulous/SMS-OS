import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsService } from "./settings.service";
import { SettingsRepository } from "./settings.repository";
import { TenantContext } from "@/server/tenant";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { createFakeRepo } from "./settings.fake";

vi.mock("@/server/audit", () => ({
  queueAudit: vi.fn(),
}));

function ctx(overrides?: Partial<TenantContext>): TenantContext {
  return {
    userId: "user-1",
    schoolId: "school-1",
    role: "ADMIN",
    can: () => true,
    ...overrides,
  };
}

describe("SettingsService", () => {
  let service: ReturnType<typeof SettingsService>;
  let repo: SettingsRepository;

  beforeEach(() => {
    repo = createFakeRepo();
    service = SettingsService(repo);
  });

  it("creates a setting and returns it", async () => {
    const result = await service.create(ctx(), {
      key: "school.timezone",
      value: "Africa/Harare",
    });

    expect(result.key).toBe("school.timezone");
    expect(result.value).toBe("Africa/Harare");
  });

  it("rejects create when value is invalid for key", async () => {
    await expect(
      service.create(ctx(), {
        key: "school.contact_email",
        value: "not-an-email",
      })
    ).rejects.toThrow("Invalid value for setting school.contact_email");
  });

  it("upserts existing setting", async () => {
    await service.create(ctx(), { key: "school.timezone", value: "Africa/Harare" });
    const result = await service.update(ctx(), "school.timezone", { value: "UTC" });

    expect(result.value).toBe("UTC");
  });

  it("returns not found for missing key", async () => {
    await expect(service.get(ctx(), "school.contact_email")).rejects.toThrow(NotFoundError);
  });

  it("respects tenant isolation in repository", async () => {
    await service.create(ctx({ schoolId: "school-1" }), { key: "school.timezone", value: "Africa/Harare" });
    const other = await service.list(ctx({ schoolId: "school-2" }));

    expect(other).toHaveLength(0);
  });

  it("throws forbidden when user lacks update permission", async () => {
    const readOnly = ctx({ role: "TEACHER", can: () => false });

    await expect(service.update(readOnly, "school.timezone", { value: "UTC" })).rejects.toThrow(ForbiddenError);
  });

  it("lists only requested keys", async () => {
    await service.create(ctx(), { key: "school.timezone", value: "Africa/Harare" });
    await service.create(ctx(), { key: "school.contact_email", value: "admin@school.zw" });

    const result = await service.list(ctx(), ["school.timezone"]);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("school.timezone");
  });
});

describe("SettingsService cross-tenant isolation", () => {
  it("never returns settings from another school", async () => {
    const repo = createFakeRepo();
    const service = SettingsService(repo);

    await service.create(ctx({ schoolId: "school-a" }), { key: "school.timezone", value: "Africa/Harare" });
    await service.create(ctx({ schoolId: "school-b" }), { key: "school.timezone", value: "UTC" });

    const a = await service.get(ctx({ schoolId: "school-a" }), "school.timezone");
    const b = await service.get(ctx({ schoolId: "school-b" }), "school.timezone");

    expect(a.value).toBe("Africa/Harare");
    expect(b.value).toBe("UTC");
  });
});
