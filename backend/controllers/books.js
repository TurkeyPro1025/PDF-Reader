const Book = require('../models/Book')
const BookshelfItem = require('../models/BookshelfItem')
const RedeemCode = require('../models/RedeemCode')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const {
  uploadsDir,
  ensureUploadsDirExists,
  toStoredRelativePath,
  resolveStoredPath
} = require('../config/storage')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsDirExists()
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'book-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
      return
    }

    cb(new Error('Only PDF files are allowed'), false)
  }
})

const createBook = (req, res) => {
  upload.single('pdf')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message })
    }

    try {
      const { title, author, publisher, isbn, category, coverUrl, description } = req.body
      if (!title || !author || !category) {
        return res.status(400).json({ message: 'Title, author and category are required' })
      }

      if (!req.file) {
        return res.status(400).json({ message: 'PDF file is required' })
      }

      const book = new Book({
        title,
        author,
        publisher,
        isbn,
        category,
        coverUrl,
        description,
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: toStoredRelativePath(req.file.filename),
        size: req.file.size,
        createdBy: req.user.userId
      })

      await book.save()
      res.status(201).json({ book })
    } catch (error) {
      console.error('Create book error:', error)
      res.status(500).json({ message: 'Server error' })
    }
  })
}

const listBooks = async (req, res) => {
  try {
    const { skip, limit } = req.pagination
    const query = {}
    if (req.query.status) {
      query.status = req.query.status
    }
    if (req.query.category) {
      query.category = req.query.category
    }

    const total = await Book.countDocuments(query)
    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    res.json({
      books,
      pagination: {
        total,
        page: req.pagination.page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('List books error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const updateBook = async (req, res) => {
  try {
    const allowedFields = ['title', 'author', 'publisher', 'isbn', 'category', 'coverUrl', 'description', 'status']
    const updates = {}

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    })
    updates.updatedAt = new Date()

    const book = await Book.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    })

    if (!book) {
      return res.status(404).json({ message: 'Book not found' })
    }

    res.json({ book })
  } catch (error) {
    console.error('Update book error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const getBookAccess = async (req, res) => {
  try {
    const item = await BookshelfItem.findOne({
      userId: req.user.userId,
      bookId: req.params.bookId,
      removedAt: null
    }).lean()

    if (!item) {
      return res.status(404).json({ message: 'Book not found in your bookshelf' })
    }

    const book = await Book.findById(req.params.bookId).lean()
    if (!book) {
      return res.status(404).json({ message: 'Book is unavailable' })
    }

    res.json({
      book,
      readingState: {
        progress: item.progress || 0,
        lastPage: item.lastPage || 1,
        lastReadAt: item.lastReadAt,
        bookmarks: item.bookmarks || []
      }
    })
  } catch (error) {
    console.error('Get book access error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
    if (!book) {
      return res.status(404).json({ message: 'Book not found' })
    }

    const hasActiveOwners = await BookshelfItem.exists({
      bookId: book._id,
      removedAt: null
    })

    await RedeemCode.updateMany(
      { bookId: book._id, status: 'unused' },
      {
        $set: {
          status: 'expired',
          expiresAt: new Date()
        }
      }
    )

    if (book.status !== 'archived') {
      book.status = 'archived'
      book.updatedAt = new Date()
      await book.save()
    }

    if (!hasActiveOwners) {
      const storedFilePath = resolveStoredPath(book.path)
      if (storedFilePath && fs.existsSync(storedFilePath)) {
        fs.unlinkSync(storedFilePath)
      }
    }

    res.json({
      message: hasActiveOwners
        ? 'Book archived successfully'
        : 'Book archived and source file removed successfully',
      book: {
        id: book._id,
        status: book.status
      }
    })
  } catch (error) {
    console.error('Delete book error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  createBook,
  listBooks,
  updateBook,
  getBookAccess,
  deleteBook
}