const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('./middleware/errorHandler')
const { ensureUploadsDirExists, uploadsDir } = require('./config/storage')

const createApp = () => {
  const app = express()
  app.disable('x-powered-by')

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

  ensureUploadsDirExists()
  app.use('/uploads', express.static(uploadsDir))

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

  const authRoutes = require('./routes/auth')
  const bookRoutes = require('./routes/books')
  const redeemCodeRoutes = require('./routes/redeemCodes')
  const bookshelfRoutes = require('./routes/bookshelf')

  app.use('/api/auth', authRoutes)
  app.use('/api/books', bookRoutes)
  app.use('/api/redeem-codes', redeemCodeRoutes)
  app.use('/api/bookshelf', bookshelfRoutes)

  app.use(errorHandler)

  return app
}

module.exports = { createApp }
