# Task 4 - Events Module Refactor

## Agent: events-module-refactor

## Summary
Refactored the Events admin module to remove Dialog-based forms, connect to real API, add settings tab, and implement full-page detail views.

## Files Modified
1. `/home/z/my-project/src/components/modules/events-module.tsx` - Complete rewrite
2. `/home/z/my-project/src/app/api/events/[id]/route.ts` - New file

## Key Changes

### 1. Dialog Removal → Inline Forms
- All Dialog components removed (Add/Edit Event Dialog, Add Fixture Dialog)
- ViewMode state pattern implemented for navigation between views
- Forms appear as full inline page views with back buttons

### 2. Real API Integration
- Events fetched from `/api/events` instead of mock INITIAL_EVENTS
- CRUD operations: GET /api/events, POST /api/events, PUT /api/events/[id], DELETE /api/events/[id]
- New API route created at `/api/events/[id]/route.ts` for individual event operations

### 3. Event Detail View
- Full-page detail view when clicking an event
- Shows event title, type badge, dates, venue
- Related upcoming events sidebar
- Quick stats sidebar
- Edit and Delete action buttons

### 4. Settings Tab
- Default View configuration (List/Calendar/Cards)
- Show Past Events toggle
- Event Type configuration with add/remove custom types
- Notification settings (Email/SMS/Push + Remind Before)
- Calendar settings (First Day of Week, Time Format)
- Export settings (CSV/PDF/iCalendar)

### 5. Sports Fixtures
- Add Fixture Dialog replaced with inline form
- Full-page form with back button

## Notes
- The SchoolEvent model fields (title, description, eventType, startDate, endDate, venue) are used from the Prisma schema
- Event types from API are uppercase (e.g., "HOLIDAY"), form values are capitalized (e.g., "Holiday") - both are supported
- Fixtures remain local (no DB model exists for SportsFixture)
