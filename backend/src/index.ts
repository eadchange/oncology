import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { createServer } from 'http'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { notFoundHandler } from './middleware/notFoundHandler'
import { requestLogger } from './middleware/requestLogger'
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import drugRoutes from './routes/drugs'
import studyRoutes from './routes/studies'
import favoriteRoutes from './routes/favorites'
import searchRoutes from './routes/search'
import helpRoutes from './routes/help'
import adminRoutes from './routes/admin'
import { startScrapingJobs } from './services/scraper/scheduler'
import { initializeDatabase } from './utils/databaseInit'

// 加载环境变量
dotenv.config()

// 初始化Prisma客户端
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// 创建Express应用
const app = express()
const server = createServer(app)

// 基本中间件
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 请求限流
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// 只对API路由应用限流
app.use('/api', limiter)

// 请求日志
app.use(requestLogger)

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  })
})

// API路由
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/drugs', drugRoutes)
app.use('/api/studies', studyRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/help', helpRoutes)
app.use('/api/admin', adminRoutes)

// 静态文件服务（管理员界面）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'))
}

// 错误处理中间件
app.use(notFoundHandler)
app.use(errorHandler)

// 优雅关闭
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`)
  
  server.close(() => {
    logger.info('HTTP server closed')
  })
  
  try {
    await prisma.$disconnect()
    logger.info('Database connection closed')
    process.exit(0)
  } catch (error) {
    logger.error('Error during shutdown:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// 启动服务器
const PORT = parseInt(process.env.PORT || '3001')

const startServer = async () => {
  try {
    // 初始化数据库
    await initializeDatabase()
    
    // 启动HTTP服务器
    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV}`)
      logger.info(`API URL: http://localhost:${PORT}/api`)
    })
    
    // 启动定时任务（数据抓取等）
    if (process.env.NODE_ENV === 'production') {
      startScrapingJobs()
    }
    
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// 只在非测试环境下启动服务器
if (require.main === module) {
  startServer()
}

export default app
