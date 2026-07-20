import { test, expect } from '@playwright/test'

test.describe('all dashboard modules load', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' })

  const modules: { id: string; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'students', label: 'Students' },
    { id: 'staff', label: 'Staff' },
    { id: 'admissions', label: 'Admissions' },
    { id: 'parent-portal', label: 'Parent Portal' },
    { id: 'student-portal', label: 'Student Portal' },
    { id: 'teacher-portal', label: 'Teacher Portal' },
    { id: 'academics', label: 'Academics' },
    { id: 'timetable', label: 'Timetable' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'examinations', label: 'Examinations' },
    { id: 'zimsec-import', label: 'ZIMSEC Bulk Import' },
    { id: 'elearning', label: 'E-Learning' },
    { id: 'reports', label: 'Reports' },
    { id: 'bulk-operations', label: 'Bulk Operations' },
    { id: 'finance', label: 'Finance' },
    { id: 'fee-calculator', label: 'Fee Calculator' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'procurement', label: 'Procurement' },
    { id: 'premium-templates', label: 'Print Templates' },
    { id: 'boarding', label: 'Boarding' },
    { id: 'transport', label: 'Transport' },
    { id: 'library', label: 'Library' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'canteen', label: 'Canteen' },
    { id: 'school-shop', label: 'School Shop' },
    { id: 'welfare', label: 'Welfare' },
    { id: 'discipline', label: 'Discipline' },
    { id: 'health', label: 'Health' },
    { id: 'sdc', label: 'SDC' },
    { id: 'events', label: 'Events & Sports' },
    { id: 'communication', label: 'Communication' },
    { id: 'documents', label: 'Documents' },
    { id: 'alumni', label: 'Alumni' },
    { id: 'notification-center', label: 'Notification Center' },
    { id: 'security', label: 'Security' },
    { id: 'settings', label: 'Settings' },
    { id: 'setup-wizard', label: 'Setup Wizard' },
    { id: 'website-cms', label: 'Website CMS' },
  ]

  for (const { id, label } of modules) {
    test(`${id} module loads`, async ({ page }) => {
      await page.goto(`/dashboard/${id}`)
      await expect(page.getByRole('heading', { name: label }).first()).toBeVisible()
    })
  }
})
