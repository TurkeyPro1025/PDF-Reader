const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization')
    if (!authHeader) {
      return res.status(401).json({ message: 'Missing authorization header' })
    }
    
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ message: 'Missing token' })
    }
    
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured')
      return res.status(500).json({ message: 'Server configuration error' })
    }
    
    const decoded = jwt.verify(token, jwtSecret)
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    }
    res.status(401).json({ message: 'Unauthorized' })
  }
}

module.exports = auth
