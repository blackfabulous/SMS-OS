# Module Decomposition Standard

This directory contains the larger feature modules for the SMS-OS dashboard. As the app grows, individual module files should stay focused and roughly **≤~300 lines**.

## Pattern

For a module `foo`:

```
src/components/modules/
├── foo-module.tsx          # thin orchestrator: state, data fetching, view routing
└── foo/                    # implementation details
    ├── foo-types.ts        # module-specific types
    ├── foo-constants.ts     # static data / config
    ├── foo-utils.ts         # pure helpers (formatting, calculations)
    ├── foo-list.tsx         # list/table view
    ├── foo-detail.tsx       # record detail view
    ├── foo-form.tsx         # add/edit form
    ├── foo-settings.tsx     # module settings view
    └── foo-*.tsx            # additional tab/section components
```

## Rules

1. **One exported default per `*-module.tsx`**. Keep orchestration only: tabs, view mode, mutations, and high-level handlers.
2. **No business UI in the orchestrator**. Tables, forms, charts, cards live in the `foo/` subfolder.
3. **Types first**. Every extracted component has typed props; shared types live in `foo-types.ts`.
4. **Use the typed API layer**. Prefer `useApiQuery` / `useApiMutation` from `src/hooks/use-api-query.ts` and `api-client.ts` over raw `fetch`.
5. **Keep checks green**. After each decomposition, run:

   ```bash
   bunx prisma validate && bun run typecheck && bun run test && bun run lint && bun run build && bunx playwright test --reporter=line
   ```

## Pilots

- `timetable/` — extracted from `timetable-module.tsx`
- `sdc/` — extracted from `sdc-module.tsx`
- `sms/` — extracted from `sms-dialog.tsx`
- `paynow/` — extracted from `paynow-dialog.tsx`

## Next candidates

- `admissions-module.tsx` (~797 lines)
- `boarding-module.tsx` (~802 lines)
- `discipline-module.tsx` (~843 lines)
- `payroll-module.tsx` (~848 lines)
- `communication-module.tsx` (~873 lines)
- `website-cms-live-module.tsx` (~735 lines)
