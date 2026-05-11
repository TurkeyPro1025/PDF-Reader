const request = require('supertest')
const { createApp } = require('../app')

describe('Health API', () => {
  jest.setTimeout(15000)

  it('returns service health payload from /api/health', async () => {
    const app = createApp()

    const response = await request(app).get('/api/health')

    expect(response.statusCode).toBe(200)

    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'backend',
        environment: expect.any(String),
        timestamp: expect.any(String)
      })
    )
  })
})
