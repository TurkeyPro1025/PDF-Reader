<template>
  <view class="upload-container">
    <view v-if="!isAdmin" class="forbidden-card">
      <text class="list-title">仅管理员可以管理图书与兑换码</text>
    </view>

    <view v-else>
      <view class="card">
        <text class="list-title">上传图书</text>
        <input v-model="bookForm.title" class="input" placeholder="书名" />
        <input v-model="bookForm.author" class="input" placeholder="作者" />
        <input v-model="bookForm.category" class="input" placeholder="分类" />
        <input v-model="bookForm.publisher" class="input" placeholder="出版社（可选）" />
        <input v-model="bookForm.isbn" class="input" placeholder="ISBN（可选）" />
        <input v-model="bookForm.coverUrl" class="input" placeholder="封面地址（可选）" />
        <textarea v-model="bookForm.description" class="textarea" placeholder="简介（可选）" />

        <view class="upload-area" @click="selectFile">
          <text class="upload-icon">📁</text>
          <text class="upload-text">点击选择图书 PDF</text>
          <text class="upload-hint">支持最大100MB的PDF文件</text>
        </view>

        <view v-if="file" class="file-info">
          <text class="file-name">{{ file.name }}</text>
          <text class="file-size">{{ formatFileSize(file.size) }}</text>
        </view>

        <view v-if="uploading" class="progress-container">
          <progress :percent="progress" stroke-width="20" color="#4CAF50" />
          <text class="progress-text">{{ progress }}%</text>
        </view>

        <view class="button-container">
          <button v-if="file && !uploading" @click="uploadFile" class="upload-btn">上传图书</button>
          <button v-if="uploading" @click="cancelUpload" class="cancel-btn">取消</button>
        </view>
      </view>

      <view class="card">
        <text class="list-title">兑换码批量生成</text>
        <input v-model="codeForm.count" class="input" type="number" placeholder="生成数量（默认1，最多100）" />
        <input v-model="codeForm.expiresAt" class="input" placeholder="过期时间，例如 2026-12-31T23:59:59.000Z" />
        <text class="upload-hint">在下方图书列表中选择一本图书生成兑换码</text>
        <view v-if="generatedCodes.length" class="generated-list">
          <text class="generated-title">最近生成</text>
          <text v-for="item in generatedCodes" :key="item.id" class="generated-code">{{ item.code }}</text>
        </view>
      </view>

      <view class="card">
        <text class="list-title">图书管理</text>
        <view v-for="book in bookList" :key="book._id" class="pdf-item">
          <view class="book-meta-block">
            <text class="pdf-name">{{ book.title }}</text>
            <text class="book-sub">{{ book.author }} · {{ book.category }}</text>
            <text class="book-sub">状态：{{ statusText(book.status) }}</text>
          </view>
          <view class="book-actions">
            <button class="open-btn" @click="toggleStatus(book)">{{ book.status === 'active' ? '下架' : '上架' }}</button>
            <button class="upload-btn small" @click="generateCodes(book)">生成兑换码</button>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="list-title">最近兑换记录</text>
        <view v-if="recentRecords.length === 0" class="empty-text">暂无兑换记录</view>
        <view v-for="record in recentRecords" :key="record.id" class="record-item">
          <text class="record-title">{{ record.book?.title || '未知图书' }}</text>
          <text class="record-sub">{{ record.user?.username || '未知用户' }} · {{ record.user?.phone || '' }}</text>
          <text class="record-sub">{{ record.code }} · {{ record.usedAt || '' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { buildApiUrl, get, getErrorMessage, patch, post } from '../../utils/http'

export default {
  data() {
    return {
      file: null,
      uploading: false,
      progress: 0,
      bookList: [],
      currentUploadTask: null,
      generatedCodes: [],
      recentRecords: [],
      codeForm: {
        count: 1,
        expiresAt: ''
      },
      bookForm: {
        title: '',
        author: '',
        category: '',
        publisher: '',
        isbn: '',
        coverUrl: '',
        description: ''
      }
    }
  },
  computed: {
    isAdmin() {
      return this.$store.getters.isAdmin
    }
  },
  onLoad() {
    if (!this.ensureAdmin()) {
      return
    }
    this.loadDashboard()
  },
  onShow() {
    if (!this.ensureAdmin()) {
      return
    }
    this.loadDashboard()
  },
  methods: {
    ensureAdmin() {
      if (this.$store.getters.isLoggedIn && this.$store.getters.isAdmin) {
        return true
      }
      uni.showToast({ title: '仅管理员可访问', icon: 'none' })
      uni.reLaunch({ url: '/pages/profile/profile' })
      return false
    },
    async loadDashboard() {
      await Promise.all([this.getBookList(), this.getRecentRecords()])
    },
    selectFile() {
      uni.chooseFile({
        count: 1,
        type: 'file',
        extension: ['.pdf'],
        success: (res) => {
          const file = res.tempFiles[0]
          if (file.size > 100 * 1024 * 1024) {
            uni.showToast({ title: '文件大小不能超过100MB', icon: 'none' })
            return
          }
          this.file = file
        }
      })
    },
    async uploadFile() {
      if (!this.file || !this.ensureAdmin()) return

      if (!this.bookForm.title || !this.bookForm.author || !this.bookForm.category) {
        uni.showToast({ title: '请填写书名、作者、分类', icon: 'none' })
        return
      }

      this.uploading = true
      this.progress = 0

      try {
        const uploadRes = await new Promise((resolve, reject) => {
          const uploadTask = uni.uploadFile({
            url: buildApiUrl('/api/books'),
            filePath: this.file.path || this.file.tempFilePath,
            name: 'pdf',
            timeout: 60000,
            header: {
              Authorization: `Bearer ${this.$store.state.token}`
            },
            formData: this.bookForm,
            success: (res) => resolve(res),
            fail: (err) => reject(err || { errMsg: 'uploadFile:fail unknown error' })
          })

          this.currentUploadTask = uploadTask
          uploadTask.onProgressUpdate((res) => {
            this.progress = res.progress
          })
        })

        const responseData = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data || '{}') : (uploadRes.data || {})
        if (uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
          uni.showToast({ title: '图书上传成功', icon: 'success' })
          this.file = null
          this.bookForm = {
            title: '',
            author: '',
            category: '',
            publisher: '',
            isbn: '',
            coverUrl: '',
            description: ''
          }
          this.getBookList()
        } else {
          uni.showToast({ title: responseData.message || '上传失败', icon: 'none' })
        }
      } catch (error) {
        uni.showToast({ title: getErrorMessage(error, '上传失败'), icon: 'none' })
      } finally {
        this.currentUploadTask = null
        this.uploading = false
        this.progress = 0
      }
    },
    cancelUpload() {
      if (this.currentUploadTask) {
        this.currentUploadTask.abort()
      }
      this.uploading = false
      this.progress = 0
      this.currentUploadTask = null
    },
    async getBookList() {
      if (!this.ensureAdmin()) {
        return
      }
      try {
        const data = await get('/api/books', {
          header: {
            Authorization: `Bearer ${this.$store.state.token}`
          }
        })
        this.bookList = data.books || []
      } catch (error) {
        uni.showToast({ title: getErrorMessage(error, '获取图书列表失败'), icon: 'none' })
      }
    },
    async toggleStatus(book) {
      try {
        const nextStatus = book.status === 'active' ? 'inactive' : 'active'
        await patch(`/api/books/${book._id}`, { status: nextStatus }, {
          header: {
            Authorization: `Bearer ${this.$store.state.token}`
          }
        })
        uni.showToast({ title: nextStatus === 'active' ? '图书已上架' : '图书已下架', icon: 'success' })
        this.getBookList()
      } catch (error) {
        uni.showToast({ title: getErrorMessage(error, '更新状态失败'), icon: 'none' })
      }
    },
    async generateCodes(book) {
      try {
        const data = await post('/api/redeem-codes', {
          bookId: book._id,
          count: this.codeForm.count,
          expiresAt: this.codeForm.expiresAt || undefined
        }, {
          header: {
            Authorization: `Bearer ${this.$store.state.token}`
          }
        })
        this.generatedCodes = data.redeemCodes || []
        uni.showToast({ title: '兑换码生成成功', icon: 'success' })
        this.getRecentRecords()
      } catch (error) {
        uni.showToast({ title: getErrorMessage(error, '生成兑换码失败'), icon: 'none' })
      }
    },
    async getRecentRecords() {
      try {
        const data = await get('/api/redeem-codes/records?limit=50', {
          header: {
            Authorization: `Bearer ${this.$store.state.token}`
          }
        })
        this.recentRecords = data.records || []
      } catch (error) {
        uni.showToast({ title: getErrorMessage(error, '获取兑换记录失败'), icon: 'none' })
      }
    },
    statusText(status) {
      return status === 'active' ? '上架中' : status === 'inactive' ? '已下架' : '已归档'
    },
    formatFileSize(size) {
      if (size < 1024) {
        return size + ' B'
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB'
      }
      return (size / (1024 * 1024)).toFixed(2) + ' MB'
    }
  }
}
</script>

<style scoped>
.upload-container {
  padding: 40rpx;
  background: #f6f7fb;
  min-height: 100vh;
}

.card,
.forbidden-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.upload-area {
  border: 2rpx dashed #ddd;
  border-radius: 16rpx;
  padding: 100rpx 40rpx;
  text-align: center;
  margin-bottom: 40rpx;
}

.input,
.textarea {
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  padding: 20rpx;
  font-size: 28rpx;
  background: #fff;
  margin-bottom: 18rpx;
}

.textarea {
  min-height: 160rpx;
  width: 100%;
}

.upload-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.upload-text {
  font-size: 32rpx;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.upload-hint {
  font-size: 24rpx;
  color: #999;
}

.file-info {
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
}

.file-name {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.file-size {
  font-size: 24rpx;
  color: #666;
}

.progress-container {
  margin-bottom: 30rpx;
}

.progress-text {
  text-align: center;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #666;
}

.button-container {
  margin-bottom: 20rpx;
}

.upload-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 32rpx;
  width: 100%;
}

.cancel-btn {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 32rpx;
  width: 100%;
}

.list-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #333;
  display: block;
}

.pdf-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  margin-bottom: 15rpx;
}

.pdf-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-meta-block {
  flex: 1;
  padding-right: 20rpx;
}

.book-sub,
.record-sub,
.empty-text,
.generated-title,
.generated-code {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-top: 8rpx;
}

.book-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.small {
  font-size: 24rpx;
  padding: 0 20rpx;
}

.open-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 10rpx 20rpx;
  font-size: 24rpx;
}

.generated-list,
.record-item {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #eee;
}

.record-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
}
</style>