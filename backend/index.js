const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const helmet = require('helmet')
const connectDB = require('./config/db')
const errorHandler = require('./middleware/errorHandler')
const { ensureUploadsDirExists, uploadsDir } = require('./config/storage')

// 加载环境变量
dotenv.config()

// 初始化应用
const app = express()
app.disable('x-powered-by')

// 中间件
// CORS 配置 - 在生产环境中应指定具体的客户端 URL
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : '*',
  credentials: process.env.NODE_ENV === 'production',
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))
app.use(helmet({
  crossOriginResourcePolicy: false
}))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// 创建上传目录
ensureUploadsDirExists()

// 静态文件服务
app.use('/uploads', express.static(uploadsDir))

// 健康检查与基础信息
app.get('/', (req, res) => {
  res.json({
    name: 'PDF Reader Backend',
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    docs: '/api/health'
  })
})

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'backend',
    timestamp: new Date().toISOString()
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'backend',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  })
})

// 路由
const authRoutes = require('./routes/auth')
const bookRoutes = require('./routes/books')
const redeemCodeRoutes = require('./routes/redeemCodes')
const bookshelfRoutes = require('./routes/bookshelf')

app.use('/api/auth', authRoutes)
app.use('/api/books', bookRoutes)
app.use('/api/redeem-codes', redeemCodeRoutes)
app.use('/api/bookshelf', bookshelfRoutes)

// 端口
// 全局错误处理中间件 - 必须放在所有其他中间件和路由之后
app.use(errorHandler)
const PORT = process.env.PORT || 5000

const startServer = async () => {
  await connectDB()

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
