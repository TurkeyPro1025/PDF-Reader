const request = require('supertest')
const { createApp } = require('../app')

jest.mock('../models/User')
const User = require('../models/User')
jest.mock('bcrypt')
const bcrypt = require('bcrypt')

describe('Auth API', () => {
  jest.setTimeout(15000)

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret-key'
  })

  describe('POST /api/auth/register', () => {
    it('registers user successfully with phone, username, password', async () => {
      const app = createApp()

      const mockUser = {
        _id: '123abc',
        username: 'testuser',
        phone: '13800138000',
        email: '',
        role: 'user'
      }

      User.findOne.mockResolvedValueOnce(null)
      User.prototype.save = jest.fn().mockResolvedValueOnce(undefined)

      const mockConstructor = jest.fn().mockImplementation(() => ({
        _id: mockUser._id,
        username: mockUser.username,
        phone: mockUser.phone,
        email: mockUser.email,
        role: mockUser.role,
        save: jest.fn().mockResolvedValue(undefined)
      }))
      User.mockImplementation(mockConstructor)

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          phone: '13800138000',
          password: 'password123'
        })

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        message: 'User registered successfully',
        user: expect.objectContaining({
          username: 'testuser',
          phone: '13800138000',
          role: 'user'
        })
      })
      expect(response.body.user.id).toBeDefined()
    })

    it('rejects duplicate phone number with 400', async () => {
      const app = createApp()

      const existingUser = {
        phone: '13800138000',
        email: null
      }

      User.findOne.mockResolvedValueOnce(existingUser)

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          phone: '13800138000',
          password: 'password123'
        })

      expect(response.statusCode).toBe(400)
      expect(response.body.message).toBe('Phone number already exists')
    })
  })

  describe('POST /api/auth/login', () => {
    it('logs in user with phone and returns token', async () => {
      const app = createApp()

      const mockUser = {
        _id: '123abc',
        username: 'testuser',
        phone: '13800138000',
        email: 'test@example.com',
        role: 'user',
        password: 'hashed_password'
      }

      User.findOne.mockResolvedValueOnce(mockUser)
      bcrypt.compare.mockResolvedValueOnce(true)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          account: '13800138000',
          password: 'password123'
        })

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        user: expect.objectContaining({
          username: 'testuser',
          phone: '13800138000',
          role: 'user'
        }),
        token: expect.any(String)
      })
    })

    it('rejects invalid credentials with 400', async () => {
      const app = createApp()

      User.findOne.mockResolvedValueOnce(null)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          account: '13800138001',
          password: 'wrongpassword'
        })

      expect(response.statusCode).toBe(400)
      expect(response.body.message).toBe('Invalid credentials')
    })
  })
})
