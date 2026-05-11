const dotenv = require('dotenv')
const connectDB = require('./config/db')
const { createApp } = require('./app')

// 加载环境变量
dotenv.config()

// 初始化应用
const app = createApp()
// 端口
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
