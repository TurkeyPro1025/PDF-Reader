const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')

// 加载环境变量
dotenv.config()

// 连接数据库
connectDB()

// 初始化应用
const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 创建上传目录
const fs = require('fs')
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads')
}

// 静态文件服务
app.use('/uploads', express.static('uploads'))

// 路由
const authRoutes = require('./routes/auth')
const pdfRoutes = require('./routes/pdf')

app.use('/api/auth', authRoutes)
app.use('/api/pdf', pdfRoutes)

// 端口
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
