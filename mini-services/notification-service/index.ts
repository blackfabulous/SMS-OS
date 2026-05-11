import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// ─── Types ──────────────────────────────────────────────────────────────────

interface ConnectedUser {
  id: string
  socketId: string
  role: 'ADMIN' | 'TEACHER' | 'BURSAR' | 'PARENT' | 'STUDENT'
  schoolId: string
  username: string
  connectedAt: Date
}

interface NotificationEvent {
  id: string
  type: 'new-notification' | 'fee-payment' | 'attendance-alert' | 'exam-result' | 'message-received'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  module?: string
  data?: Record<string, unknown>
  timestamp: string
  sender?: string
}

// ─── State ──────────────────────────────────────────────────────────────────

const connectedUsers = new Map<string, ConnectedUser>()
const notificationHistory: NotificationEvent[] = []
const MAX_HISTORY = 100

const generateId = () => Math.random().toString(36).substr(2, 9)

// ─── Demo Notifications (simulated school events) ───────────────────────────

const demoNotifications: Omit<NotificationEvent, 'id' | 'timestamp'>[] = [
  { type: 'fee-payment', title: 'Fee Payment Received', description: 'Payment of $350.00 received from Tendai Moyo', priority: 'medium', module: 'finance' },
  { type: 'attendance-alert', title: 'Attendance Alert', description: 'Form 2B has 5 students absent today - above threshold', priority: 'high', module: 'attendance' },
  { type: 'exam-result', title: 'Exam Results Published', description: 'ZIMSEC O-Level results are now available for review', priority: 'high', module: 'examinations' },
  { type: 'message-received', title: 'New Message', description: 'SDC Chairperson sent a message regarding the upcoming meeting', priority: 'medium', module: 'communication' },
  { type: 'new-notification', title: 'New Student Enrolled', description: 'Chido Ndlovu has been enrolled in Form 3A', priority: 'low', module: 'students' },
  { type: 'fee-payment', title: 'Outstanding Fees Alert', description: '3 students have outstanding fees exceeding $500', priority: 'critical', module: 'finance' },
  { type: 'attendance-alert', title: 'Chronic Absenteeism', description: 'Kudzai Chikumbu has missed 15 consecutive days', priority: 'high', module: 'attendance' },
  { type: 'message-received', title: 'Parent Inquiry', description: 'Mrs. Dube is asking about her child\'s progress report', priority: 'medium', module: 'communication' },
]

// ─── Helper Functions ───────────────────────────────────────────────────────

function createNotification(base: Omit<NotificationEvent, 'id' | 'timestamp'>): NotificationEvent {
  const notification: NotificationEvent = {
    ...base,
    id: generateId(),
    timestamp: new Date().toISOString(),
  }
  notificationHistory.unshift(notification)
  if (notificationHistory.length > MAX_HISTORY) {
    notificationHistory.pop()
  }
  return notification
}

function getRoleRoom(role: string, schoolId: string): string {
  return `school:${schoolId}:role:${role}`
}

function getSchoolRoom(schoolId: string): string {
  return `school:${schoolId}`
}

// ─── Simulate Periodic Notifications ────────────────────────────────────────

let notificationInterval: ReturnType<typeof setInterval> | null = null

function startDemoNotifications() {
  // Send a demo notification every 45 seconds
  notificationInterval = setInterval(() => {
    const demo = demoNotifications[Math.floor(Math.random() * demoNotifications.length)]
    const notification = createNotification(demo)

    // Broadcast to all connected users
    io.emit('new-notification', notification)
    console.log(`[Notification] ${notification.type}: ${notification.title}`)

    // Also emit to specific role rooms
    if (notification.module === 'finance') {
      io.to(getRoleRoom('BURSAR', 'default')).emit('fee-payment', notification)
      io.to(getRoleRoom('ADMIN', 'default')).emit('fee-payment', notification)
    }
    if (notification.module === 'attendance') {
      io.to(getRoleRoom('TEACHER', 'default')).emit('attendance-alert', notification)
      io.to(getRoleRoom('ADMIN', 'default')).emit('attendance-alert', notification)
    }
    if (notification.module === 'examinations') {
      io.to(getRoleRoom('TEACHER', 'default')).emit('exam-result', notification)
      io.to(getRoleRoom('ADMIN', 'default')).emit('exam-result', notification)
    }
  }, 45000)
}

// ─── Connection Handler ─────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`)
  let currentUser: ConnectedUser | null = null

  // Send welcome with connection status
  socket.emit('connection-established', {
    socketId: socket.id,
    timestamp: new Date().toISOString(),
    serverStatus: 'online',
  })

  // Send recent notification history
  socket.emit('notification-history', notificationHistory.slice(0, 20))

  // ─── Join User ──────────────────────────────────────────────────────────

  socket.on('join', (data: { role: string; schoolId: string; username: string }) => {
    currentUser = {
      id: generateId(),
      socketId: socket.id,
      role: data.role as ConnectedUser['role'],
      schoolId: data.schoolId || 'default',
      username: data.username,
      connectedAt: new Date(),
    }

    connectedUsers.set(socket.id, currentUser)

    // Join school room
    socket.join(getSchoolRoom(currentUser.schoolId))

    // Join role room
    socket.join(getRoleRoom(currentUser.role, currentUser.schoolId))

    // Join personal room
    socket.join(`user:${socket.id}`)

    console.log(`[User] ${currentUser.username} (${currentUser.role}) joined school:${currentUser.schoolId}`)

    // Send confirmation
    socket.emit('join-confirmed', {
      user: currentUser,
      rooms: [getSchoolRoom(currentUser.schoolId), getRoleRoom(currentUser.role, currentUser.schoolId)],
    })

    // Broadcast user joined to school room
    socket.to(getSchoolRoom(currentUser.schoolId)).emit('user-online', {
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
    })
  })

  // ─── Send Notification ─────────────────────────────────────────────────

  socket.on('send-notification', (data: {
    type: NotificationEvent['type']
    title: string
    description: string
    priority?: NotificationEvent['priority']
    module?: string
    targetRole?: string
    targetUser?: string
    data?: Record<string, unknown>
  }) => {
    const notification = createNotification({
      type: data.type,
      title: data.title,
      description: data.description,
      priority: data.priority || 'medium',
      module: data.module,
      data: data.data,
      sender: currentUser?.username,
    })

    if (data.targetUser) {
      // Send to specific user
      io.to(`user:${data.targetUser}`).emit(data.type, notification)
    } else if (data.targetRole) {
      // Send to specific role
      const schoolId = currentUser?.schoolId || 'default'
      io.to(getRoleRoom(data.targetRole, schoolId)).emit(data.type, notification)
    } else {
      // Broadcast to all
      io.emit('new-notification', notification)
    }

    console.log(`[Notification] ${notification.type}: ${notification.title}`)
  })

  // ─── Test Event ─────────────────────────────────────────────────────────

  socket.on('test', (data) => {
    console.log('[Test] Received:', data)
    socket.emit('test-response', {
      message: 'Notification service is running',
      data,
      timestamp: new Date().toISOString(),
      connectedUsers: connectedUsers.size,
    })
  })

  // ─── Get Online Users ──────────────────────────────────────────────────

  socket.on('get-online-users', () => {
    const schoolId = currentUser?.schoolId || 'default'
    const schoolUsers = Array.from(connectedUsers.values())
      .filter(u => u.schoolId === schoolId)
      .map(u => ({ userId: u.id, username: u.username, role: u.role }))
    socket.emit('online-users', schoolUsers)
  })

  // ─── Disconnect ────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    if (currentUser) {
      console.log(`[User] ${currentUser.username} disconnected`)
      socket.to(getSchoolRoom(currentUser.schoolId)).emit('user-offline', {
        userId: currentUser.id,
        username: currentUser.username,
      })
      connectedUsers.delete(socket.id)
    } else {
      console.log(`[Socket] Disconnected: ${socket.id}`)
    }
  })

  socket.on('error', (error) => {
    console.error(`[Error] Socket ${socket.id}:`, error)
  })
})

// ─── Start Server ───────────────────────────────────────────────────────────

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[ZimSchool] Notification service running on port ${PORT}`)
  startDemoNotifications()
})

// ─── Graceful Shutdown ──────────────────────────────────────────────────────

process.on('SIGTERM', () => {
  console.log('[Shutdown] SIGTERM received')
  if (notificationInterval) clearInterval(notificationInterval)
  httpServer.close(() => {
    console.log('[Shutdown] Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[Shutdown] SIGINT received')
  if (notificationInterval) clearInterval(notificationInterval)
  httpServer.close(() => {
    console.log('[Shutdown] Server closed')
    process.exit(0)
  })
})
