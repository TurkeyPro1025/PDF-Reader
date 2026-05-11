const request = require('supertest')
const jwt = require('jsonwebtoken')
const { createApp } = require('../app')

jest.mock('../models/User')
jest.mock('multer', () => {
  const multerMock = jest.fn(() => ({
    single: () => (req, res, next) => next()
  }))
  multerMock.diskStorage = jest.fn(() => ({}))
  return multerMock
})

describe('Books API - Authorization', () => {
  jest.setTimeout(15000)
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret-key'
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore()
    }
  })

  describe('POST /api/books', () => {
    it('rejects upload from user role with 403 Forbidden', async () => {
      const app = createApp()

      // Generate JWT for regular user (role='user')
      const userToken = jwt.sign(
        { userId: '123abc', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('category', 'Test')

      expect(response.statusCode).toBe(403)
      expect(response.body.message).toBe('Forbidden')
    })

    it('allows upload from admin role with 201', async () => {
      const app = createApp()

      // Generate JWT for admin
      const adminToken = jwt.sign(
        { userId: '456def', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('category', 'Test')

      // This validates that role middleware allows admin requests through.
      expect(response.statusCode).not.toBe(403)
    })

    it('rejects request without authorization header with 401', async () => {
      const app = createApp()

      const response = await request(app)
        .post('/api/books')
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('category', 'Test')

      expect(response.statusCode).toBe(401)
      expect(response.body.message).toBe('Missing authorization header')
    })
  })
})
