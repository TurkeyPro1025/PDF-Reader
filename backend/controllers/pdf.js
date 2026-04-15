const PDF = require('../models/PDF')
const multer = require('multer')
const path = require('path')

// 配置文件存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// 文件过滤
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Only PDF files are allowed'), false)
  }
}

// 配置multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: fileFilter
})

// 上传PDF
const uploadPDF = (req, res) => {
  upload.single('pdf')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message })
    }

    try {
      const pdf = new PDF({
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        userId: req.user.userId
      })

      await pdf.save()
      res.json({ pdf })
    } catch (error) {
      res.status(500).json({ message: 'Server error' })
    }
  })
}

// 获取PDF列表
const listPDFs = async (req, res) => {
  try {
    const pdfs = await PDF.find({ userId: req.user.userId })
    res.json({ pdfs })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// 获取单个PDF
const getPDF = async (req, res) => {
  try {
    const pdf = await PDF.findOne({ _id: req.params.id, userId: req.user.userId })
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' })
    }
    res.json({ pdf })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// 删除PDF
const deletePDF = async (req, res) => {
  try {
    const pdf = await PDF.findOneAndDelete({ _id: req.params.id, userId: req.user.userId })
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' })
    }
    res.json({ message: 'PDF deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  upload: uploadPDF,
  list: listPDFs,
  get: getPDF,
  delete: deletePDF
}
