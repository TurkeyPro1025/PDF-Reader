const fs = require('fs')
const path = require('path')

const backendRoot = path.resolve(__dirname, '..')
const uploadsDir = path.join(backendRoot, 'uploads')

const ensureUploadsDirExists = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
}

const toStoredRelativePath = (filename) => path.posix.join('uploads', filename)

const resolveStoredPath = (storedPath) => {
  if (!storedPath) {
    return null
  }
  if (path.isAbsolute(storedPath)) {
    return storedPath
  }

  return path.resolve(backendRoot, storedPath.replace(/\\/g, '/'))
}

module.exports = {
  uploadsDir,
  ensureUploadsDirExists,
  toStoredRelativePath,
  resolveStoredPath
}