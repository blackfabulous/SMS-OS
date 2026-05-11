import { NextResponse } from 'next/server'

// Mock audit log data for ZimSchool Pro
const auditLogs = [
  { id: '1', timestamp: '2025-03-06T10:45:00Z', user: 'Admin User', module: 'Students', action: 'CREATE', details: 'Created student record for Tendai Moyo (STD2025001)', ipAddress: '192.168.1.10' },
  { id: '2', timestamp: '2025-03-06T10:30:00Z', user: 'Clerk User', module: 'Finance', action: 'CREATE', details: 'Created invoice INV2025001 for $630.00', ipAddress: '192.168.1.15' },
  { id: '3', timestamp: '2025-03-06T10:15:00Z', user: 'Mr. Dube', module: 'Auth', action: 'LOGIN', details: 'User logged in successfully', ipAddress: '192.168.1.22' },
  { id: '4', timestamp: '2025-03-06T09:50:00Z', user: 'Mrs. Ncube', module: 'Attendance', action: 'CREATE', details: 'Bulk attendance recorded for Form 2A - 28 students', ipAddress: '192.168.1.23' },
  { id: '5', timestamp: '2025-03-06T09:30:00Z', user: 'Clerk User', module: 'Finance', action: 'UPDATE', details: 'Recorded payment of $450.00 for Chido Mutasa (RCT2025012)', ipAddress: '192.168.1.15' },
  { id: '6', timestamp: '2025-03-05T16:20:00Z', user: 'Admin User', module: 'Staff', action: 'CREATE', details: 'Created staff record for Mr. Zvinavashe (STF2025018)', ipAddress: '192.168.1.10' },
  { id: '7', timestamp: '2025-03-05T15:45:00Z', user: 'Mrs. Ncube', module: 'Students', action: 'UPDATE', details: 'Updated enrollment status for Kudzai Gumbo to TRANSFERRED', ipAddress: '192.168.1.23' },
  { id: '8', timestamp: '2025-03-05T15:10:00Z', user: 'Mr. Dube', module: 'Academics', action: 'CREATE', details: 'Created assessment "Term 1 Mathematics Test" for Form 3', ipAddress: '192.168.1.22' },
  { id: '9', timestamp: '2025-03-05T14:30:00Z', user: 'Clerk User', module: 'Finance', action: 'CREATE', details: 'Created invoice INV2025005 for $770.00', ipAddress: '192.168.1.15' },
  { id: '10', timestamp: '2025-03-05T13:55:00Z', user: 'Admin User', module: 'Settings', action: 'UPDATE', details: 'Updated school profile - changed contact phone number', ipAddress: '192.168.1.10' },
  { id: '11', timestamp: '2025-03-05T11:20:00Z', user: 'Mrs. Ncube', module: 'Welfare', action: 'CREATE', details: 'Submitted BEAM application for Tamuka Sigauke', ipAddress: '192.168.1.23' },
  { id: '12', timestamp: '2025-03-05T10:40:00Z', user: 'Mr. Dube', module: 'Discipline', action: 'CREATE', details: 'Created discipline incident - bullying report for Form 4B', ipAddress: '192.168.1.22' },
  { id: '13', timestamp: '2025-03-05T09:15:00Z', user: 'Clerk User', module: 'Auth', action: 'LOGIN', details: 'User logged in successfully', ipAddress: '192.168.1.15' },
  { id: '14', timestamp: '2025-03-05T08:30:00Z', user: 'Mr. Dube', module: 'Auth', action: 'LOGIN', details: 'User logged in successfully', ipAddress: '192.168.1.22' },
  { id: '15', timestamp: '2025-03-04T16:00:00Z', user: 'Admin User', module: 'Students', action: 'DELETE', details: 'Archived student record for Tapiwa Dzvene (dropped out 2024)', ipAddress: '192.168.1.10' },
  { id: '16', timestamp: '2025-03-04T14:25:00Z', user: 'Mrs. Ncube', module: 'Attendance', action: 'UPDATE', details: 'Updated attendance record - marked late as excused for Rumbi Chigwedere', ipAddress: '192.168.1.23' },
  { id: '17', timestamp: '2025-03-04T13:00:00Z', user: 'Clerk User', module: 'Finance', action: 'UPDATE', details: 'Updated invoice INV2024003 status from PENDING to OVERDUE', ipAddress: '192.168.1.15' },
  { id: '18', timestamp: '2025-03-04T11:45:00Z', user: 'Mr. Dube', module: 'Examinations', action: 'CREATE', details: 'Registered 45 ZIMSEC candidates for 2025 O Level', ipAddress: '192.168.1.22' },
  { id: '19', timestamp: '2025-03-04T10:10:00Z', user: 'Admin User', module: 'Boarding', action: 'UPDATE', details: 'Assigned student Tendai Moyo to Hostel A, Dorm 3, Bed 5', ipAddress: '192.168.1.10' },
  { id: '20', timestamp: '2025-03-04T09:00:00Z', user: 'Mrs. Ncube', module: 'Auth', action: 'LOGIN', details: 'User logged in successfully', ipAddress: '192.168.1.23' },
  { id: '21', timestamp: '2025-03-03T15:30:00Z', user: 'Clerk User', module: 'Finance', action: 'CREATE', details: 'Recorded payment of $250.00 via EcoCash (RCT2025008)', ipAddress: '192.168.1.15' },
  { id: '22', timestamp: '2025-03-03T14:15:00Z', user: 'Mr. Dube', module: 'Staff', action: 'UPDATE', details: 'Updated leave balance for Mrs. Ncube - added 5 days annual leave', ipAddress: '192.168.1.22' },
  { id: '23', timestamp: '2025-03-03T12:00:00Z', user: 'Admin User', module: 'Settings', action: 'UPDATE', details: 'Updated fee structure for Form 5 & 6 - tuition increased to $600', ipAddress: '192.168.1.10' },
  { id: '24', timestamp: '2025-03-03T10:30:00Z', user: 'Mrs. Ncube', module: 'Health', action: 'CREATE', details: 'Created health record for student with asthma - sick bay visit', ipAddress: '192.168.1.23' },
  { id: '25', timestamp: '2025-03-03T08:45:00Z', user: 'Admin User', module: 'Auth', action: 'LOGIN', details: 'User logged in successfully', ipAddress: '192.168.1.10' },
  { id: '26', timestamp: '2025-03-02T16:00:00Z', user: 'Clerk User', module: 'Library', action: 'CREATE', details: 'Added 15 new library books to catalog', ipAddress: '192.168.1.15' },
  { id: '27', timestamp: '2025-03-02T14:30:00Z', user: 'Mr. Dube', module: 'SDC', action: 'CREATE', details: 'Created SDC meeting minutes for March 2025 meeting', ipAddress: '192.168.1.22' },
  { id: '28', timestamp: '2025-03-02T11:00:00Z', user: 'Admin User', module: 'Students', action: 'UPDATE', details: 'Updated BEAM status for 12 students from PENDING to APPROVED', ipAddress: '192.168.1.10' },
  { id: '29', timestamp: '2025-03-02T09:15:00Z', user: 'Mrs. Ncube', module: 'Transport', action: 'UPDATE', details: 'Updated transport route R03 - added 3 new student assignments', ipAddress: '192.168.1.23' },
  { id: '30', timestamp: '2025-03-01T15:45:00Z', user: 'Admin User', module: 'Payroll', action: 'CREATE', details: 'Processed March 2025 payroll for 42 staff members', ipAddress: '192.168.1.10' },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const user = searchParams.get('user')
  const moduleFilter = searchParams.get('module')
  const action = searchParams.get('action')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  let filtered = [...auditLogs]

  if (user && user !== 'ALL') {
    filtered = filtered.filter(log => log.user === user)
  }
  if (moduleFilter && moduleFilter !== 'ALL') {
    filtered = filtered.filter(log => log.module === moduleFilter)
  }
  if (action && action !== 'ALL') {
    filtered = filtered.filter(log => log.action === action)
  }
  if (startDate) {
    filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(startDate))
  }
  if (endDate) {
    filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(endDate + 'T23:59:59Z'))
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return NextResponse.json({
    data: filtered,
    total: filtered.length,
    users: [...new Set(auditLogs.map(l => l.user))],
    modules: [...new Set(auditLogs.map(l => l.module))],
    actions: [...new Set(auditLogs.map(l => l.action))],
  })
}
