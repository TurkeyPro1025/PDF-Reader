const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const redeemCodeController = require('../controllers/redeemCodes')

router.post('/', authMiddleware, requireRole('admin'), redeemCodeController.generateCodes)
router.get('/records', authMiddleware, requireRole('admin'), redeemCodeController.listRecentRecords)

module.exports = router