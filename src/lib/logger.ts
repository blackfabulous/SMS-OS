import 'server-only'
import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    service: 'zimschool-pro',
    env: process.env.NODE_ENV || 'development',
  },
})

function toLogObject(args: unknown[]): { obj?: Record<string, unknown>; msg: string } {
  const [first, ...rest] = args

  if (first instanceof Error) {
    return { obj: { err: first }, msg: 'uncaught error' }
  }

  if (typeof first === 'string') {
    const obj: Record<string, unknown> = {}
    let hasObj = false
    for (const item of rest) {
      if (item instanceof Error) {
        obj.err = item
        hasObj = true
      } else if (item && typeof item === 'object' && !Array.isArray(item)) {
        Object.assign(obj, item)
        hasObj = true
      }
    }
    return { obj: hasObj ? obj : undefined, msg: first }
  }

  if (first && typeof first === 'object') {
    return { obj: first as Record<string, unknown>, msg: 'log' }
  }

  return { obj: { value: first }, msg: 'log' }
}

export function installConsoleLogger() {
  if (typeof window !== 'undefined') return

  const consoleTarget = console as unknown as Record<string, (...args: unknown[]) => void>
  const loggerTarget = logger as unknown as Record<string, (arg1: unknown, arg2?: string) => void>

  const levels = ['error', 'warn', 'info', 'log'] as const
  for (const level of levels) {
    const loggerLevel = level === 'log' ? 'debug' : level
    consoleTarget[level] = (...args: unknown[]) => {
      const { obj, msg } = toLogObject(args)
      if (obj) {
        loggerTarget[loggerLevel](obj, msg)
      } else {
        loggerTarget[loggerLevel](msg)
      }
    }
  }
}

installConsoleLogger()
