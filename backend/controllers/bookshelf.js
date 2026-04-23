const Book = require('../models/Book')
const RedeemCode = require('../models/RedeemCode')
const BookshelfItem = require('../models/BookshelfItem')

const buildCategories = (items) => {
  const map = new Map()
  items.forEach((item) => {
    const category = item.bookId?.category || '未分类'
    map.set(category, (map.get(category) || 0) + 1)
  })

  return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
}

const redeem = async (req, res) => {
  try {
    const inputCode = (req.body.code || '').toUpperCase().trim()
    if (!inputCode) {
      return res.status(400).json({ message: 'Redeem code is required' })
    }

    const redeemCode = await RedeemCode.findOne({ code: inputCode })
    if (!redeemCode) {
      return res.status(404).json({ message: 'Redeem code not found' })
    }

    if (redeemCode.expiresAt && new Date(redeemCode.expiresAt).getTime() < Date.now()) {
      redeemCode.status = 'expired'
      await redeemCode.save()
      return res.status(400).json({ message: 'Redeem code has expired' })
    }

    if (redeemCode.status === 'used') {
      return res.status(400).json({ message: 'Redeem code has already been used' })
    }

    const book = await Book.findById(redeemCode.bookId)
    if (!book || book.status !== 'active') {
      return res.status(400).json({ message: 'Book cannot be redeemed' })
    }

    let bookshelfItem = await BookshelfItem.findOne({
      userId: req.user.userId,
      bookId: redeemCode.bookId
    })

    if (bookshelfItem?.removedAt === null) {
      return res.status(400).json({ message: 'Book is already in your bookshelf' })
    }

    if (bookshelfItem) {
      bookshelfItem.removedAt = null
      bookshelfItem.addedAt = new Date()
      bookshelfItem.progress = 0
      bookshelfItem.lastPage = 1
      bookshelfItem.lastReadAt = null
      bookshelfItem.bookmarks = []
    } else {
      bookshelfItem = new BookshelfItem({
        userId: req.user.userId,
        bookId: redeemCode.bookId
      })
    }

    redeemCode.status = 'used'
    redeemCode.usedBy = req.user.userId
    redeemCode.usedAt = new Date()

    await bookshelfItem.save()
    await redeemCode.save()

    res.json({
      message: 'Redeemed successfully',
      book: {
        id: book._id,
        title: book.title,
        author: book.author,
        category: book.category,
        coverUrl: book.coverUrl,
        status: book.status
      }
    })
  } catch (error) {
    console.error('Redeem error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const listBookshelf = async (req, res) => {
  try {
    const items = await BookshelfItem.find({
      userId: req.user.userId,
      removedAt: null
    })
      .sort({ addedAt: -1 })
      .populate('bookId')
      .lean()

    const visibleItems = items.filter((item) => item.bookId)

    const bookshelf = visibleItems
      .map((item) => ({
        id: item.bookId._id,
        shelfId: item._id,
        title: item.bookId.title,
        author: item.bookId.author,
        category: item.bookId.category,
        coverUrl: item.bookId.coverUrl,
        description: item.bookId.description,
        status: item.bookId.status,
        progress: item.progress || 0,
        lastPage: item.lastPage || 1,
        lastReadAt: item.lastReadAt,
        addedAt: item.addedAt,
        bookmarks: item.bookmarks || []
      }))

    const recentReads = [...bookshelf]
      .filter((item) => item.lastReadAt)
      .sort((left, right) => new Date(right.lastReadAt) - new Date(left.lastReadAt))
      .slice(0, 5)

    res.json({
      bookshelf,
      categories: buildCategories(visibleItems),
      recentReads
    })
  } catch (error) {
    console.error('List bookshelf error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const updateReadingState = async (req, res) => {
  try {
    const { progress, lastPage, bookmarks } = req.body
    const bookshelfItem = await BookshelfItem.findOne({
      userId: req.user.userId,
      bookId: req.params.bookId,
      removedAt: null
    })

    if (!bookshelfItem) {
      return res.status(404).json({ message: 'Book not found in your bookshelf' })
    }

    if (progress !== undefined) {
      bookshelfItem.progress = Math.min(100, Math.max(0, Number(progress) || 0))
    }
    if (lastPage !== undefined) {
      bookshelfItem.lastPage = Math.max(1, Number(lastPage) || 1)
    }
    if (Array.isArray(bookmarks)) {
      bookshelfItem.bookmarks = bookmarks
        .filter((bookmark) => bookmark && bookmark.id && bookmark.page)
        .map((bookmark) => ({
          id: String(bookmark.id),
          page: Number(bookmark.page),
          label: bookmark.label || '',
          createdAt: bookmark.createdAt || new Date()
        }))
    }
    bookshelfItem.lastReadAt = new Date()

    await bookshelfItem.save()
    res.json({ message: 'Reading state updated successfully' })
  } catch (error) {
    console.error('Update reading state error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const removeBook = async (req, res) => {
  return res.status(400).json({ message: 'Redeemed books are permanently owned and cannot be removed' })
}

module.exports = {
  redeem,
  listBookshelf,
  updateReadingState,
  removeBook
}