# Task 3 - Admin Modules Refactor

## Agent: admin-modules-refactor
## Status: COMPLETED

## Summary
Refactored Staff and Students admin modules to replace Dialog-based forms with inline page views, add detailed settings tabs, and enhance detail views.

## Changes Made

### staff-module.tsx
- **Replaced AddStaffDialog** with `AddStaffInlineForm` - full-page inline form that replaces the list view
- **Added advanced form fields**: Address, Next of Kin, Bank Details (Zimbabwe banks), Subject Specialisation, National ID, Employment Date, Middle Name
- **Organized form into 6 sections**: Personal Info, Employment Details, Contact Info, Qualifications, Next of Kin, Bank Details
- **Added StaffSettingsView** with 4 setting cards: Display Settings, Staff Number Format, Required Fields, Notifications & Export
- **Enhanced StaffDetailView**: 6 tabs (was 4) - added Documents and Timeline tabs
- **Added action buttons**: Edit, Deactivate, Report
- **ViewMode pattern**: 'list' | 'add' | 'edit' | 'detail' | 'settings'

### students-module.tsx
- **Replaced AddStudentDialog** with `AddStudentInlineForm` - multi-step form with 4 steps and step indicators
  - Step 1: Basic Info (name, DOB, gender, birth cert, boarding, nationality, religion, language, previous school)
  - Step 2: Parent/Guardian (primary + secondary parent details)
  - Step 3: Medical (blood group, allergies, chronic conditions, doctor info)
  - Step 4: Review (summary of all entered data)
- **Added StudentSettingsView** with 4 setting cards: Display, Number Format, Required Fields, Photo/Age/BEAM
- **Enhanced StudentDetailView**: 7 tabs (was ~5) - added Health, Documents, Timeline tabs
- **Added action buttons**: Edit, Transfer, Report Card
- **ViewMode pattern**: 'list' | 'add' | 'edit' | 'detail' | 'settings'

## API Compatibility
All existing API endpoints preserved intact. No backend changes required.

## Lint Status
Both files pass ESLint with zero errors.
