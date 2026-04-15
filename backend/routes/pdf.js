const express = require('express')
const router = express.Router()
const pdfController = require('../controllers/pdf')
const authMiddleware = require('../middleware/auth')

router.post('/upload', authMiddleware, pdfController.upload)
router.get('/list', authMiddleware, pdfController.list)
router.get('/:id', authMiddleware, pdfController.get)
router.delete('/:id', authMiddleware, pdfController.delete)

module.exports = router
