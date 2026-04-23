const mongoose = require('mongoose')
const createIndexes = require('./indexes')

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pdf-reader')
    console.log('MongoDB connected')
    
    // 创建索引
    await createIndexes()
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

module.exports = connectDB
