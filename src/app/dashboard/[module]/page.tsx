import { notFound } from 'next/navigation'
import { getModuleIds } from '@/components/module-registry'
import DashboardShell from '@/components/dashboard-shell'

export const dynamic = 'force-dynamic'

export default async function DashboardModulePage({
  params,
}: {
  params: Promise<{ module: string }>
}) {
  const { module } = await params
  if (!getModuleIds().includes(module)) {
    notFound()
  }

  return <DashboardShell moduleId={module} />
}
