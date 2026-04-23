const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const authController = require('../controllers/auth')
const { validateRegister, validateLogin } = require('../middleware/validation')

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		message: 'Too many authentication requests, please try again later'
	}
})

router.post('/register', authLimiter, validateRegister, authController.register)
router.post('/login', authLimiter, validateLogin, authController.login)

module.exports = router
