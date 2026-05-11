const request = require('supertest')
const jwt = require('jsonwebtoken')
const { createApp } = require('../app')

jest.mock('../models/User')
jest.mock('../models/Book')
jest.mock('../models/RedeemCode')
jest.mock('../models/BookshelfItem')
const Book = require('../models/Book')
const RedeemCode = require('../models/RedeemCode')
const BookshelfItem = require('../models/BookshelfItem')

describe('Bookshelf API - Redeem', () => {
  jest.setTimeout(15000)

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret-key'
  })

  describe('POST /api/bookshelf/redeem', () => {
    it('rejects empty redeem code with 400', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123abc', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const response = await request(app)
        .post('/api/bookshelf/redeem')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: '   ' })

      expect(response.statusCode).toBe(400)
      expect(response.body.message).toBe('Redeem code is required')
    })

    it('redeems valid code and adds book to bookshelf', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123abc', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const mockRedeemCode = {
        _id: 'code1',
        code: 'ABCD1234',
        bookId: '789ghi',
        status: 'unused',
        expiresAt: null,
        save: jest.fn().mockResolvedValue(undefined)
      }

      const mockBook = {
        _id: '789ghi',
        title: 'Test Book',
        author: 'Test Author',
        category: 'Test',
        coverUrl: 'http://example.com/cover.jpg',
        status: 'active'
      }

      const mockBookshelfItem = {
        userId: '123abc',
        bookId: '789ghi',
        removedAt: null,
        addedAt: new Date(),
        progress: 0,
        lastPage: 1,
        lastReadAt: null,
        bookmarks: [],
        save: jest.fn().mockResolvedValue(undefined)
      }

      RedeemCode.findOne.mockResolvedValueOnce(mockRedeemCode)
      Book.findById.mockResolvedValueOnce(mockBook)
      BookshelfItem.findOne.mockResolvedValueOnce(null)
      BookshelfItem.mockImplementation(() => mockBookshelfItem)

      const response = await request(app)
        .post('/api/bookshelf/redeem')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'ABCD1234'
        })

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        message: 'Redeemed successfully',
        book: expect.objectContaining({
          title: 'Test Book',
          author: 'Test Author',
          status: 'active'
        })
      })
    })

    it('rejects invalid redeem code with 404', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123abc', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      RedeemCode.findOne.mockResolvedValueOnce(null)

      const response = await request(app)
        .post('/api/bookshelf/redeem')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'INVALID123'
        })

      expect(response.statusCode).toBe(404)
      expect(response.body.message).toBe('Redeem code not found')
    })

    it('rejects already-used code with 400', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123abc', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const mockRedeemCode = {
        _id: 'code1',
        code: 'ABCD1234',
        bookId: '789ghi',
        status: 'used',
        expiresAt: null
      }

      RedeemCode.findOne.mockResolvedValueOnce(mockRedeemCode)

      const response = await request(app)
        .post('/api/bookshelf/redeem')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'ABCD1234'
        })

      expect(response.statusCode).toBe(400)
      expect(response.body.message).toBe('Redeem code has already been used')
    })

    it('rejects expired code with 400 and marks it expired', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123abc', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const mockRedeemCode = {
        _id: 'code-expired',
        code: 'EXPIRED01',
        bookId: '789ghi',
        status: 'unused',
        expiresAt: new Date(Date.now() - 60 * 1000),
        save: jest.fn().mockResolvedValue(undefined)
      }

      RedeemCode.findOne.mockResolvedValueOnce(mockRedeemCode)

      const response = await request(app)
        .post('/api/bookshelf/redeem')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'EXPIRED01' })

      expect(response.statusCode).toBe(400)
      expect(response.body.message).toBe('Redeem code has expired')
      expect(mockRedeemCode.status).toBe('expired')
      expect(mockRedeemCode.save).toHaveBeenCalledTimes(1)
    })

    it('rejects redeem when target book is inactive', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123abc', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const mockRedeemCode = {
        _id: 'code1',
        code: 'BOOKOFF01',
        bookId: '789ghi',
        status: 'unused',
        expiresAt: null
      }

      const mockBook = {
        _id: '789ghi',
        title: 'Inactive Book',
        status: 'inactive'
      }

      RedeemCode.findOne.mockResolvedValueOnce(mockRedeemCode)
      Book.findById.mockResolvedValueOnce(mockBook)

      const response = await request(app)
        .post('/api/bookshelf/redeem')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'BOOKOFF01' })

      expect(response.statusCode).toBe(400)
      expect(response.body.message).toBe('Book cannot be redeemed')
    })

    it('rejects duplicate redeem for same user with 400', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123abc', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const mockRedeemCode = {
        _id: 'code1',
        code: 'ABCD1234',
        bookId: '789ghi',
        status: 'unused',
        expiresAt: null
      }

      const mockBook = {
        _id: '789ghi',
        title: 'Test Book',
        status: 'active'
      }

      const mockExistingItem = {
        userId: '123abc',
        bookId: '789ghi',
        removedAt: null
      }

      RedeemCode.findOne.mockResolvedValueOnce(mockRedeemCode)
      Book.findById.mockResolvedValueOnce(mockBook)
      BookshelfItem.findOne.mockResolvedValueOnce(mockExistingItem)

      const response = await request(app)
        .post('/api/bookshelf/redeem')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'ABCD1234'
        })

      expect(response.statusCode).toBe(400)
      expect(response.body.message).toBe('Book is already in your bookshelf')
    })
  })

  describe('GET /api/bookshelf', () => {
    it('returns current user bookshelf with categories and recent reads', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123abc', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const mockItems = [
        {
          _id: 'shelf1',
          userId: '123abc',
          progress: 35,
          lastPage: 12,
          lastReadAt: new Date('2026-05-10T10:00:00.000Z'),
          addedAt: new Date('2026-05-01T10:00:00.000Z'),
          bookmarks: [{ id: 'b1', page: 12, label: '重点' }],
          bookId: {
            _id: 'book1',
            title: 'Book One',
            author: 'Author A',
            category: 'Tech',
            coverUrl: 'http://example.com/one.jpg',
            description: 'desc one',
            status: 'active'
          }
        },
        {
          _id: 'shelf2',
          userId: '123abc',
          progress: 0,
          lastPage: 1,
          lastReadAt: null,
          addedAt: new Date('2026-05-02T10:00:00.000Z'),
          bookmarks: [],
          bookId: {
            _id: 'book2',
            title: 'Book Two',
            author: 'Author B',
            category: 'Tech',
            coverUrl: 'http://example.com/two.jpg',
            description: 'desc two',
            status: 'active'
          }
        }
      ]

      BookshelfItem.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockItems)
          })
        })
      })

      const response = await request(app)
        .get('/api/bookshelf')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.statusCode).toBe(200)
      expect(response.body.bookshelf).toHaveLength(2)
      expect(response.body.categories).toEqual([{ name: 'Tech', count: 2 }])
      expect(response.body.recentReads).toHaveLength(1)
    })
  })

  describe('PUT /api/bookshelf/:bookId/progress', () => {
    it('updates reading progress and bookmarks', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123abc', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const mockBookshelfItem = {
        userId: '123abc',
        bookId: '789ghi',
        removedAt: null,
        progress: 0,
        lastPage: 1,
        bookmarks: [],
        save: jest.fn().mockResolvedValue(undefined)
      }

      BookshelfItem.findOne.mockResolvedValueOnce(mockBookshelfItem)

      const response = await request(app)
        .put('/api/bookshelf/789ghi/progress')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          progress: 48,
          lastPage: 77,
          bookmarks: [
            { id: 'm1', page: 77, label: 'chapter mark' },
            { id: 'm2', page: 80, label: 'note mark' }
          ]
        })

      expect(response.statusCode).toBe(200)
      expect(response.body.message).toBe('Reading state updated successfully')
      expect(mockBookshelfItem.progress).toBe(48)
      expect(mockBookshelfItem.lastPage).toBe(77)
      expect(mockBookshelfItem.bookmarks).toHaveLength(2)
      expect(mockBookshelfItem.save).toHaveBeenCalledTimes(1)
    })

    it('returns 404 when book is not in user bookshelf', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123abc', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      BookshelfItem.findOne.mockResolvedValueOnce(null)

      const response = await request(app)
        .put('/api/bookshelf/789ghi/progress')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ progress: 10, lastPage: 5 })

      expect(response.statusCode).toBe(404)
      expect(response.body.message).toBe('Book not found in your bookshelf')
    })

    it('clamps progress to 0-100 and lastPage to minimum 1', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123abc', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const mockBookshelfItem = {
        userId: '123abc',
        bookId: '789ghi',
        removedAt: null,
        progress: 0,
        lastPage: 1,
        bookmarks: [],
        save: jest.fn().mockResolvedValue(undefined)
      }

      BookshelfItem.findOne.mockResolvedValueOnce(mockBookshelfItem)

      const response = await request(app)
        .put('/api/bookshelf/789ghi/progress')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ progress: 999, lastPage: -8 })

      expect(response.statusCode).toBe(200)
      expect(mockBookshelfItem.progress).toBe(100)
      expect(mockBookshelfItem.lastPage).toBe(1)
    })
  })

  describe('DELETE /api/bookshelf/:bookId', () => {
    it('rejects remove because redeemed books are permanently owned', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123abc', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const response = await request(app)
        .delete('/api/bookshelf/789ghi')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.statusCode).toBe(400)
      expect(response.body.message).toBe('Redeemed books are permanently owned and cannot be removed')
    })
  })
})
