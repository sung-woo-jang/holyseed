/**
 * 간단한 로거 유틸리티
 */

type LogLevel = 'info' | 'success' | 'warn' | 'error'

const colors = {
  info: '\x1b[36m', // Cyan
  success: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
}

const getTimestamp = (): string => {
  return new Date().toISOString()
}

const log = (level: LogLevel, message: string, data?: any) => {
  const color = colors[level]
  const timestamp = getTimestamp()
  const prefix = `${color}[${level.toUpperCase()}]${colors.reset}`

  console.log(`${prefix} [${timestamp}] ${message}`)

  if (data !== undefined) {
    console.log(data)
  }
}

export const logger = {
  info: (message: string, data?: any) => log('info', message, data),
  success: (message: string, data?: any) => log('success', message, data),
  warn: (message: string, data?: any) => log('warn', message, data),
  error: (message: string, data?: any) => log('error', message, data),
}
