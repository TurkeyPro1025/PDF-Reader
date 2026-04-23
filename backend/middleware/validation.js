/**
 * Input validation middleware
 * Validates request body data
 */

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

const validatePhone = (phone) => {
  const re = /^1\d{10}$/
  return re.test(phone)
}

const validatePassword = (password) => {
  return password && password.length >= 6
}

const validateUsername = (username) => {
  return username && username.trim().length >= 2
}

/**
 * Validate register request
 */
const validateRegister = (req, res, next) => {
  const { username, phone, email, password } = req.body

  if (!username || !validateUsername(username)) {
    return res.status(400).json({ 
      message: 'Username must be at least 2 characters' 
    })
  }

  if (!phone || !validatePhone(phone)) {
    return res.status(400).json({ 
      message: 'Invalid phone number format' 
    })
  }

  if (email && !validateEmail(email)) {
    return res.status(400).json({
      message: 'Invalid email format'
    })
  }

  if (!password || !validatePassword(password)) {
    return res.status(400).json({ 
      message: 'Password must be at least 6 characters' 
    })
  }

  next()
}

/**
 * Validate login request
 */
const validateLogin = (req, res, next) => {
  const { account, password } = req.body

  if (!account) {
    return res.status(400).json({ 
      message: 'Phone number or email is required' 
    })
  }

  const isPhone = validatePhone(account)
  const isEmail = validateEmail(account)
  if (!isPhone && !isEmail) {
    return res.status(400).json({
      message: 'Invalid phone number or email format'
    })
  }

  if (!password) {
    return res.status(400).json({ 
      message: 'Password is required' 
    })
  }

  next()
}

module.exports = {
  validateRegister,
  validateLogin,
  validateEmail,
  validatePhone,
  validatePassword,
  validateUsername
}
