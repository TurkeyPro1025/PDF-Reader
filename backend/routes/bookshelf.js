const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
const bookshelfController = require('../controllers/bookshelf')

router.post('/redeem', authMiddleware, bookshelfController.redeem)
router.get('/', authMiddleware, bookshelfController.listBookshelf)
router.put('/:bookId/progress', authMiddleware, bookshelfController.updateReadingState)
router.delete('/:bookId', authMiddleware, bookshelfController.removeBook)

module.exports = router