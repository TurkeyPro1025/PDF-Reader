const mongoose = require('mongoose')

const bookmarkSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  page: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false })

const bookshelfItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  removedAt: {
    type: Date,
    default: null
  },
  lastReadAt: {
    type: Date,
    default: null
  },
  progress: {
    type: Number,
    default: 0
  },
  lastPage: {
    type: Number,
    default: 1
  },
  bookmarks: {
    type: [bookmarkSchema],
    default: []
  }
})

module.exports = mongoose.model('BookshelfItem', bookshelfItemSchema)