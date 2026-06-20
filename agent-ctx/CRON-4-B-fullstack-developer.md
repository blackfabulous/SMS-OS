# Task CRON-4-B: Fee Calculator & Setup Wizard

## Summary
Built Fee Calculator / Currency Converter module and Onboarding Setup Wizard for ZimSchool Pro.

## Files Created/Modified
1. **Created** `/src/components/modules/fee-calculator-module.tsx` (~1200 lines)
   - 5 tabs: Overview, Fee Calculator, Currency Converter, Payment Plans, Scholarships
   - Zimbabwe-specific fee data, USD/ZiG conversion, BEAM eligibility checker
   - Historical exchange rate chart, batch conversion, payment plan generator

2. **Modified** `/src/components/modules/settings-module.tsx`
   - Added "Setup Wizard" tab as first tab with Wand2 icon
   - 5-step wizard: School Info, Academic Setup, Fee Structure, User Setup, Complete
   - Animated progress bar, step navigation, framer-motion transitions
   - Added Checkbox, AnimatePresence imports, new lucide icons

3. **Modified** `/src/app/page.tsx`
   - Added Calculator icon import
   - Added FeeCalculatorModule import
   - Added 'fee-calculator' to Finance nav group
   - Added moduleInfo entry and conditional rendering

## Lint Status
- Zero errors, zero warnings
- Dev server running on port 3000

## Dependencies
- Uses existing shadcn/ui components (Tabs, Card, Table, Select, Dialog, Checkbox, etc.)
- Uses recharts for currency trend and scholarship charts
- Uses framer-motion for wizard step transitions
- No new packages installed
