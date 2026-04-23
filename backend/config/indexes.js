/**
 * Database indexes for optimization
 * 在应用启动时执行此文件以创建所需的索引
 */

const User = require('../models/User')
const Book = require('../models/Book')
const RedeemCode = require('../models/RedeemCode')
const BookshelfItem = require('../models/BookshelfItem')

/**
 * 创建数据库索引
 */
const createIndexes = async () => {
  try {
    await User.collection.createIndex({ phone: 1 }, { unique: true })
    console.log('✓ Created unique index on User.phone')

    await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true })
    console.log('✓ Created unique sparse index on User.email')

    await Book.collection.createIndex({ status: 1, category: 1, createdAt: -1 })
    console.log('✓ Created index on Book.status + category + createdAt')

    await Book.collection.createIndex({ createdBy: 1, createdAt: -1 })
    console.log('✓ Created index on Book.createdBy + createdAt')

    await RedeemCode.collection.createIndex({ code: 1 }, { unique: true })
    console.log('✓ Created unique index on RedeemCode.code')

    await RedeemCode.collection.createIndex({ bookId: 1, status: 1, createdAt: -1 })
    console.log('✓ Created index on RedeemCode.bookId + status + createdAt')

    await RedeemCode.collection.createIndex({ usedAt: -1 })
    console.log('✓ Created index on RedeemCode.usedAt')

    await BookshelfItem.collection.createIndex({ userId: 1, bookId: 1 }, { unique: true })
    console.log('✓ Created unique index on BookshelfItem.userId + bookId')

    await BookshelfItem.collection.createIndex({ userId: 1, removedAt: 1, lastReadAt: -1 })
    console.log('✓ Created index on BookshelfItem.userId + removedAt + lastReadAt')

    console.log('All indexes created successfully')
  } catch (error) {
    console.error('Error creating indexes:', error)
  }
}

module.exports = createIndexes
