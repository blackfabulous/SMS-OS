# Settings Service — Reference Implementation

This context demonstrates the standard slice that every migrated context should follow:

```
settings/
├── settings.schema.ts     # Zod input/output schemas (shared with frontend)
├── settings.types.ts      # TypeScript DTOs
├── settings.repository.ts # Tenant-scoped Prisma data access
├── settings.service.ts    # Business logic, auth, audit, validation
├── settings.test.ts       # Unit tests with a fake repository + cross-tenant tests
└── index.ts               # Barrel export
```

## Rules

1. **No business logic in route handlers / Server Actions.** They call the service.
2. **Repository always injects `schoolId` and `deletedAt: null` via `tenantBase()`.
3. **Service asserts policy with `assertCan()` before any operation.
4. **Validation is done with Zod, then runtime key/value validation.
5. **Audit events are queued to the outbox.
6. **Unit tests use a fake repository so the service is testable without HTTP or DB.

## Usage

```ts
import { settings } from "@/server/services";
import { createTenantContext } from "@/server/policies";

const ctx = createTenantContext({ userId: "u1", schoolId: "s1", role: "ADMIN" });
const service = settings.SettingsService(settings.SettingsRepository());

await service.upsert(ctx, "school.timezone", { value: "Africa/Harare" });
```

## Next context

After `Settings` is proven, copy this structure to `School`, `Student`, `Finance`, etc.
