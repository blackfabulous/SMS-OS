# Task 2 - public-website-refactor

## Task
Refactor public website component: convert staff login from Dialog to full-page, add news/event detail pages

## Work Completed
- Updated PageName type with 'news-detail' | 'event-detail'
- Extended news mock data with fullContent field
- Replaced LoginDialog with full-page LoginPage (split layout, role selector, animated background)
- Created NewsDetailPage component with related news sidebar
- Created EventDetailPage component with related events sidebar
- Updated NewsSectionComponent with onViewDetail callback (removed Dialog)
- Updated EventsSectionComponent with onViewDetail callback (cards clickable)
- Updated PublicWebsite main component with showLogin, selectedNewsId, selectedEventId states

## Files Modified
- `/home/z/my-project/src/components/public-website.tsx` - Main public website component

## Key Decisions
- Login page uses showLogin state to replace entire website view when active
- Detail pages use selectedNewsId/selectedEventId + currentPage state for routing
- No new Next.js routes added - all navigation is client-side
- Dialog components removed from news section - replaced with full page navigation
