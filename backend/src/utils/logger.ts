import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'

// 日志级别
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
}

// 日志颜色
export const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'grey',
}

// 添加颜色支持
winston.addColors(LOG_COLORS)

// 创建日志目录
const logsDir = path.join(process.cwd(), 'logs')

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
)

// 控制台格式
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    return `${timestamp} [${level}]: ${message} ${metaStr}`
  })
)

// 创建日志传输器
const transports: winston.transport[] = []

// 控制台输出（开发环境）
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    })
  )
}

// 错误日志文件
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: process.env.LOG_FILE_MAX_SIZE || '100m',
    maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
    zippedArchive: true,
  })
)

// 组合日志文件
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: process.env.LOG_FILE_MAX_SIZE || '100m',
    maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
    zippedArchive: true,
  })
)

// HTTP请求日志文件
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      format: logFormat,
      maxSize: process.env.LOG_FILE_MAX_SIZE || '100m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
      zippedArchive: true,
    })
  )
}

// 创建日志实例
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: LOG_LEVELS,
  format: logFormat,
  transports,
  exitOnError: false,
})

// 请求日志中间件使用的日志实例
export const requestLogger = winston.createLogger({
  level: 'http',
  levels: LOG_LEVELS,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: logFormat,
      maxSize: process.env.LOG_FILE_MAX_SIZE || '100m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
      zippedArchive: true,
    }),
  ],
})

// 数据库查询日志
export const queryLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels: LOG_LEVELS,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, duration, query }) => {
      return `${timestamp} [${level.toUpperCase()}] Database Query: ${message} (Duration: ${duration}ms)`
    })
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'query-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'debug',
      format: logFormat,
      maxSize: process.env.LOG_FILE_MAX_SIZE || '100m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '7d',
      zippedArchive: true,
    }),
  ],
})

// 错误日志专用方法
export const logError = (error: Error, context?: any) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  })
}

// 数据库查询日志
export const logQuery = (query: string, duration: number) => {
  queryLogger.debug({
    message: query,
    duration,
    timestamp: new Date().toISOString(),
  })
}

// 用户操作日志
export const logUserAction = (userId: number, action: string, details?: any) => {
  logger.info({
    type: 'user_action',
    userId,
    action,
    details,
    timestamp: new Date().toISOString(),
  })
}

// 安全事件日志
export const logSecurityEvent = (event: string, details?: any) => {
  logger.warn({
    type: 'security_event',
    event,
    details,
    timestamp: new Date().toISOString(),
  })
}

// 性能日志
export const logPerformance = (operation: string, duration: number, details?: any) => {
  logger.info({
    type: 'performance',
    operation,
    duration,
    details,
    timestamp: new Date().toISOString(),
  })
}

export default logger
