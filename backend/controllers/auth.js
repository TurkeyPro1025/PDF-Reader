const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { validateEmail } = require('../middleware/validation')

const register = async (req, res) => {
  try {
    const { username, phone, email, password } = req.body

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [
        { phone },
        ...(email ? [{ email }] : [])
      ]
    })
    if (existingUser?.phone === phone) {
      return res.status(400).json({ message: 'Phone number already exists' })
    }
    if (existingUser?.email && email && existingUser.email === email) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    // 哈希密码
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 创建新用户
    const user = new User({
      username,
      phone,
      email: email || undefined,
      password: hashedPassword
    })

    await user.save()
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        email: user.email || '',
        role: user.role
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const login = async (req, res) => {
  try {
    const { account, password } = req.body
    const query = validateEmail(account)
      ? { email: account.toLowerCase() }
      : { phone: account }

    // 检查用户是否存在
    const user = await User.findOne(query)
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // 检查JWT_SECRET配置
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured')
      return res.status(500).json({ message: 'Server configuration error' })
    }

    // 生成token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    )

    res.json({
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        email: user.email || '',
        role: user.role
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  register,
  login
}
