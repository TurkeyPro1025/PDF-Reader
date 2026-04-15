<template>
  <view class="upload-container">
    <view class="upload-area" @click="selectFile">
      <text class="upload-icon">📁</text>
      <text class="upload-text">点击选择PDF文件</text>
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
      <button v-if="file && !uploading" @click="uploadFile" class="upload-btn">上传</button>
      <button v-if="uploading" @click="cancelUpload" class="cancel-btn">取消</button>
    </view>
    
    <view class="pdf-list">
      <text class="list-title">已上传的PDF</text>
      <view v-for="pdf in pdfList" :key="pdf._id" class="pdf-item">
        <text class="pdf-name">{{ pdf.originalname }}</text>
        <button @click="openPDF(pdf)" class="open-btn">打开</button>
      </view>
    </view>
  </view>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      file: null,
      uploading: false,
      progress: 0,
      pdfList: []
    }
  },
  onLoad() {
    this.getPDFList()
  },
  methods: {
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
      if (!this.file) return
      
      this.uploading = true
      this.progress = 0
      
      try {
        const formData = new FormData()
        formData.append('pdf', this.file)
        
        const response = await axios.post('/api/pdf/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${this.$store.state.token}`
          },
          onUploadProgress: (progressEvent) => {
            this.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          }
        })
        
        uni.showToast({ title: '上传成功', icon: 'success' })
        this.file = null
        this.getPDFList()
      } catch (error) {
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        this.uploading = false
        this.progress = 0
      }
    },
    cancelUpload() {
      // 取消上传逻辑
      this.uploading = false
      this.progress = 0
    },
    async getPDFList() {
      try {
        const response = await axios.get('/api/pdf/list', {
          headers: {
            'Authorization': `Bearer ${this.$store.state.token}`
          }
        })
        this.pdfList = response.data.pdfs
      } catch (error) {
        console.error('获取PDF列表失败:', error)
      }
    },
    openPDF(pdf) {
      uni.navigateTo({
        url: `/pages/reader/reader?id=${pdf._id}&name=${pdf.originalname}`
      })
    },
    formatFileSize(size) {
      if (size < 1024) {
        return size + ' B'
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB'
      } else {
        return (size / (1024 * 1024)).toFixed(2) + ' MB'
      }
    }
  }
}
</script>

<style scoped>
.upload-container {
  padding: 40rpx;
}

.upload-area {
  border: 2rpx dashed #ddd;
  border-radius: 16rpx;
  padding: 100rpx 40rpx;
  text-align: center;
  margin-bottom: 40rpx;
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
  margin-bottom: 50rpx;
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

.pdf-list {
  margin-top: 30rpx;
}

.list-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #333;
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

.open-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 10rpx 20rpx;
  font-size: 24rpx;
}
</style>