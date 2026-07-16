import { validateAuth } from '@/lib/api-auth'
import { ok } from '@/server/http'

// ─── ZIMSEC Bulk Import - CSV Template Download ──────────────────────────────
// Returns a CSV template with the required headers for ZIMSEC results bulk import.

export async function GET() {
  const authResult = await validateAuth()
  if ('error' in authResult) return authResult.error

  // CSV template headers and sample data
  const headers = 'studentNumber,subject,grade,marks,year,level,session'
  const sampleRows = [
    'STD-2024-001,Mathematics,A,85,2025,O-Level,June',
    'STD-2024-001,English,B,72,2025,O-Level,June',
    'STD-2024-001,Shona,A*,91,2025,O-Level,June',
    'STD-2024-001,Physics,C,58,2025,O-Level,June',
    'STD-2024-001,Chemistry,B,68,2025,O-Level,June',
    'STD-2024-001,Biology,A,82,2025,O-Level,June',
    'STD-2024-001,History,B,74,2025,O-Level,June',
    'STD-2024-001,Geography,C,55,2025,O-Level,June',
    'STD-2024-002,Mathematics,B,76,2025,O-Level,June',
    'STD-2024-002,English,A,88,2025,O-Level,June',
    'STD-2022-001,Pure Mathematics,A,89,2025,A-Level,June',
    'STD-2022-001,Physics,A*,92,2025,A-Level,June',
    'STD-2022-001,Chemistry,B,78,2025,A-Level,June',
  ]

  const csvContent = [headers, ...sampleRows].join('\n')

  return ok({ csv: csvContent })
}
