const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const pagination = require('../middleware/pagination')
const bookController = require('../controllers/books')

router.get('/:bookId/read', authMiddleware, bookController.getBookAccess)
router.get('/', authMiddleware, requireRole('admin'), pagination, bookController.listBooks)
router.post('/', authMiddleware, requireRole('admin'), bookController.createBook)
router.patch('/:id', authMiddleware, requireRole('admin'), bookController.updateBook)
router.delete('/:id', authMiddleware, requireRole('admin'), bookController.deleteBook)

module.exports = router