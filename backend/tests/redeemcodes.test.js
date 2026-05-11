const request = require('supertest')
const jwt = require('jsonwebtoken')
const { createApp } = require('../app')

jest.mock('../models/User')
jest.mock('../models/Book')
jest.mock('../models/RedeemCode')
const Book = require('../models/Book')
const RedeemCode = require('../models/RedeemCode')

describe('Redeem Codes API', () => {
  jest.setTimeout(15000)

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret-key'
  })

  describe('POST /api/redeem-codes', () => {
    it('generates redeem codes for active book by admin', async () => {
      const app = createApp()

      const adminToken = jwt.sign(
        { userId: '456def', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const mockBook = {
        _id: '789ghi',
        title: 'Test Book',
        status: 'active'
      }

      const mockCodes = [
        {
          _id: 'code1',
          code: 'ABCD1234',
          bookId: '789ghi',
          status: 'unused',
          expiresAt: null
        },
        {
          _id: 'code2',
          code: 'EFGH5678',
          bookId: '789ghi',
          status: 'unused',
          expiresAt: null
        }
      ]

      Book.findById.mockResolvedValueOnce(mockBook)
      RedeemCode.exists.mockResolvedValue(false)
      RedeemCode.insertMany.mockResolvedValueOnce(mockCodes)

      const response = await request(app)
        .post('/api/redeem-codes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookId: '789ghi',
          count: 2,
          expiresAt: null
        })

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        redeemCodes: expect.arrayContaining([
          expect.objectContaining({
            code: expect.any(String),
            status: 'unused'
          })
        ])
      })
      expect(response.body.redeemCodes.length).toBe(2)
    })

    it('rejects generating codes for inactive book with 400', async () => {
      const app = createApp()

      const adminToken = jwt.sign(
        { userId: '456def', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      const mockBook = {
        _id: '789ghi',
        title: 'Test Book',
        status: 'inactive'
      }

      Book.findById.mockResolvedValueOnce(mockBook)

      const response = await request(app)
        .post('/api/redeem-codes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookId: '789ghi',
          count: 1
        })

      expect(response.statusCode).toBe(400)
      expect(response.body.message).toBe('Inactive books cannot generate redeem codes')
    })

    it('rejects when book not found with 404', async () => {
      const app = createApp()

      const adminToken = jwt.sign(
        { userId: '456def', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      Book.findById.mockResolvedValueOnce(null)

      const response = await request(app)
        .post('/api/redeem-codes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookId: 'nonexistent',
          count: 1
        })

      expect(response.statusCode).toBe(404)
      expect(response.body.message).toBe('Book not found')
    })
  })
})
