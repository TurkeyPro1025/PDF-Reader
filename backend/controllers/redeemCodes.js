const crypto = require('crypto')
const Book = require('../models/Book')
const RedeemCode = require('../models/RedeemCode')

const createUniqueCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

const generateCodes = async (req, res) => {
  try {
    const { bookId, count, expiresAt } = req.body
    const safeCount = Math.min(100, Math.max(1, parseInt(count, 10) || 1))
    const book = await Book.findById(bookId)

    if (!book) {
      return res.status(404).json({ message: 'Book not found' })
    }
    if (book.status !== 'active') {
      return res.status(400).json({ message: 'Inactive books cannot generate redeem codes' })
    }

    const items = []
    for (let index = 0; index < safeCount; index += 1) {
      let code = createUniqueCode()
      // eslint-disable-next-line no-await-in-loop
      while (await RedeemCode.exists({ code })) {
        code = createUniqueCode()
      }

      items.push({
        code,
        bookId,
        expiresAt: expiresAt || undefined,
        createdBy: req.user.userId
      })
    }

    const codes = await RedeemCode.insertMany(items)
    res.status(201).json({
      redeemCodes: codes.map((item) => ({
        id: item._id,
        code: item.code,
        status: item.status,
        expiresAt: item.expiresAt
      }))
    })
  } catch (error) {
    console.error('Generate codes error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const listRecentRecords = async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50))
    const records = await RedeemCode.find({ status: 'used' })
      .sort({ usedAt: -1 })
      .limit(limit)
      .populate('bookId', 'title author category')
      .populate('usedBy', 'username phone email')
      .lean()

    res.json({
      records: records.map((record) => ({
        id: record._id,
        code: record.code,
        status: record.status,
        usedAt: record.usedAt,
        expiresAt: record.expiresAt,
        book: record.bookId,
        user: record.usedBy
      }))
    })
  } catch (error) {
    console.error('List recent redeem records error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  generateCodes,
  listRecentRecords
}