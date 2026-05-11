const request = require('supertest')
const jwt = require('jsonwebtoken')
const { createApp } = require('../app')

jest.mock('../models/User')
jest.mock('../models/Book')

const Book = require('../models/Book')

describe('Books API - Management', () => {
  jest.setTimeout(15000)

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret-key'
  })

  describe('POST /api/books (admin-only endpoint)', () => {
    it('blocks non-admin users from accessing book upload', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123user', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('category', 'Technology')

      expect(response.statusCode).toBe(403)
      expect(response.body.message).toBe('Forbidden')
    })

    it('blocks unauthenticated requests to book upload', async () => {
      const app = createApp()

      const response = await request(app)
        .post('/api/books')
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('category', 'Technology')

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /api/books (admin-only endpoint)', () => {
    it('requires admin authentication to list books', async () => {
      const app = createApp()

      const response = await request(app)
        .get('/api/books')
        .query({ limit: 10, skip: 0 })

      expect(response.statusCode).toBe(401)
    })

    it('blocks non-admin from listing books', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123user', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const response = await request(app)
        .get('/api/books')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ limit: 10, skip: 0 })

      expect(response.statusCode).toBe(403)
      expect(response.body.message).toBe('Forbidden')
    })
  })

  describe('PATCH /api/books/:id (admin-only)', () => {
    it('blocks non-admin users from updating book status', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123user', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const response = await request(app)
        .patch('/api/books/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'inactive' })

      expect(response.statusCode).toBe(403)
      expect(response.body.message).toBe('Forbidden')
    })

    it('allows admin to update book status', async () => {
      const app = createApp()

      const adminToken = jwt.sign(
        { userId: '789admin', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const mockUpdatedBook = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Book',
        status: 'inactive',
        updatedAt: new Date()
      }

      Book.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue(mockUpdatedBook)

      const response = await request(app)
        .patch('/api/books/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' })

      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('book')
    })
  })

  describe('DELETE /api/books/:id (admin-only soft delete)', () => {
    it('blocks non-admin from deleting books', async () => {
      const app = createApp()

      const userToken = jwt.sign(
        { userId: '123user', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const response = await request(app)
        .delete('/api/books/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.statusCode).toBe(403)
      expect(response.body.message).toBe('Forbidden')
    })

    it('requires authentication to delete books', async () => {
      const app = createApp()

      const response = await request(app)
        .delete('/api/books/507f1f77bcf86cd799439011')

      expect(response.statusCode).toBe(401)
    })
  })
})

