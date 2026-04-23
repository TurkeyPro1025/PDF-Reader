/**
 * Pagination middleware
 * Adds pagination query to request
 * Usage: /api/pdf/list?page=1&limit=10
 */

const pagination = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10))
  
  req.pagination = {
    skip: (page - 1) * limit,
    limit: limit,
    page: page
  }
  
  next()
}

module.exports = pagination
