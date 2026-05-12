'use client'

import dynamic from 'next/dynamic'
import React from 'react'

// Loading fallback component
function ModuleLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-200 border-t-emerald-600" />
        <p className="text-sm text-muted-foreground">Loading module...</p>
      </div>
    </div>
  )
}

// Dynamic module loader - each module is loaded on-demand only when accessed
// Using next/dynamic ensures proper code splitting and lazy loading
const moduleMap: Record<string, React.ComponentType> = {
  'login': dynamic(() => import('@/components/login-page'), { loading: ModuleLoadingFallback, ssr: false }),
  'dashboard': dynamic(() => import('@/components/dashboard'), { loading: ModuleLoadingFallback, ssr: false }),
  'students': dynamic(() => import('@/components/modules/students-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'staff': dynamic(() => import('@/components/modules/staff-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'finance': dynamic(() => import('@/components/modules/finance-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'attendance': dynamic(() => import('@/components/modules/attendance-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'academics': dynamic(() => import('@/components/modules/academics-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'examinations': dynamic(() => import('@/components/modules/examinations-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'boarding': dynamic(() => import('@/components/modules/boarding-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'transport': dynamic(() => import('@/components/modules/transport-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'library': dynamic(() => import('@/components/modules/library-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'inventory': dynamic(() => import('@/components/modules/inventory-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'welfare': dynamic(() => import('@/components/modules/welfare-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'discipline': dynamic(() => import('@/components/modules/discipline-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'health': dynamic(() => import('@/components/modules/health-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'admissions': dynamic(() => import('@/components/modules/admissions-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'payroll': dynamic(() => import('@/components/modules/payroll-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'sdc': dynamic(() => import('@/components/modules/sdc-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'communication': dynamic(() => import('@/components/modules/communication-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'reports': dynamic(() => import('@/components/modules/reports-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'settings': dynamic(() => import('@/components/modules/settings-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'timetable': dynamic(() => import('@/components/modules/timetable-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'events': dynamic(() => import('@/components/modules/events-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'canteen': dynamic(() => import('@/components/modules/canteen-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'procurement': dynamic(() => import('@/components/modules/procurement-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'documents': dynamic(() => import('@/components/modules/documents-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'alumni': dynamic(() => import('@/components/modules/alumni-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'security': dynamic(() => import('@/components/modules/security-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'elearning': dynamic(() => import('@/components/modules/elearning-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'parent-portal': dynamic(() => import('@/components/modules/parent-portal-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'student-portal': dynamic(() => import('@/components/modules/student-portal-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'teacher-portal': dynamic(() => import('@/components/modules/teacher-portal-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'fee-calculator': dynamic(() => import('@/components/modules/fee-calculator-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'setup-wizard': dynamic(() => import('@/components/modules/setup-wizard-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'zimsec-import': dynamic(() => import('@/components/modules/zimsec-bulk-import-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'notification-center': dynamic(() => import('@/components/modules/notification-center-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'bulk-operations': dynamic(() => import('@/components/modules/bulk-operations-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'premium-templates': dynamic(() => import('@/components/modules/premium-templates-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'website-cms': dynamic(() => import('@/components/modules/website-cms-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'school-shop': dynamic(() => import('@/components/modules/school-shop-module'), { loading: ModuleLoadingFallback, ssr: false }),
  'admin-cms': dynamic(() => import('@/components/modules/admin-cms-module'), { loading: ModuleLoadingFallback, ssr: false }),
}

// Placeholder for unknown modules
function ModulePlaceholder({ moduleId }: { moduleId: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
        <span className="text-2xl">📦</span>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold">{moduleId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
        <p className="text-sm text-muted-foreground mt-1">This module is under development</p>
      </div>
    </div>
  )
}

export function ModuleRenderer({ moduleId }: { moduleId: string }) {
  const ModuleComponent = moduleMap[moduleId]
  if (!ModuleComponent) {
    return <ModulePlaceholder moduleId={moduleId} />
  }
  return <ModuleComponent />
}

export function getModuleIds(): string[] {
  return Object.keys(moduleMap)
}
