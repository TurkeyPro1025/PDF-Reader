/**
 * Global error handling middleware
 * Should be the last middleware
 */

const errorHandler = (err, req, res, next) => {
  // Log error
  console.error({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack
  })

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      details: err.message
    })
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format'
    })
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token'
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired'
    })
  }

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        message: 'File too large (max 100MB)'
      })
    }
    return res.status(400).json({
      message: 'File upload error: ' + err.message
    })
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0]
    return res.status(400).json({
      message: `${field} already exists`
    })
  }

  // Default error
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  })
}

module.exports = errorHandler
