const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    // 检查用户是否已存在
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // 哈希密码
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 创建新用户
    const user = new User({
      username,
      email,
      password: hashedPassword
    })

    await user.save()
    res.status(201).json({ message: 'User registered successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // 检查用户是否存在
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // 生成token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      token
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  register,
  login
}
