import { notFound } from 'next/navigation'
import { isModuleId } from '@/lib/module-ids'
import DashboardShell from '@/components/dashboard-shell'

export const dynamic = 'force-dynamic'

export default async function DashboardModulePage({
  params,
}: {
  params: Promise<{ module: string }>
}) {
  const { module } = await params
  if (!isModuleId(module)) {
    notFound()
  }

  return <DashboardShell moduleId={module} />
}
