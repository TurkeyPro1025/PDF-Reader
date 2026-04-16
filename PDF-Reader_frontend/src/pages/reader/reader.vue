<template>
  <view class="reader-container" :style="{ backgroundColor: backgroundColor }">
    <!-- 自定义导航栏 -->
    <view class="navbar">
      <button @click="goBack" class="back-btn">←</button>
      <text class="title">{{ pdfName }}</text>
      <button @click="showMenu = !showMenu" class="menu-btn">☰</button>
    </view>
    
    <!-- 阅读区域 -->
    <view class="content">
      <view v-for="page in pages" :key="page" class="page-container">
        <canvas :id="'page-' + page" class="pdf-page"></canvas>
      </view>
    </view>
    
    <!-- 菜单面板 -->
    <view v-if="showMenu" class="menu-panel" :style="{ backgroundColor: menuBackgroundColor }">
      <view class="menu-section">
        <text class="menu-section-title">字体设置</text>
        <view class="font-options">
          <button 
            v-for="font in fonts" 
            :key="font"
            @click="setFont(font)"
            :class="{ active: currentFont === font }"
            class="font-btn"
          >
            {{ font }}
          </button>
        </view>
        <view class="font-size">
          <button @click="decreaseFontSize" class="size-btn">A-</button>
          <text class="current-size">{{ fontSize }}px</text>
          <button @click="increaseFontSize" class="size-btn">A+</button>
        </view>
      </view>
      
      <view class="menu-section">
        <text class="menu-section-title">背景设置</text>
        <view class="background-options">
          <view 
            v-for="(color, index) in backgroundColors" 
            :key="index"
            @click="setBackground(index)"
            :class="{ active: currentBackground === index }"
            class="background-item"
            :style="{ backgroundColor: color.value }"
          ></view>
        </view>
      </view>
      
      <view class="menu-section">
        <text class="menu-section-title">书签</text>
        <button @click="addBookmark" class="bookmark-btn">添加书签</button>
        <view v-if="bookmarks.length > 0" class="bookmark-list">
          <view v-for="bookmark in bookmarks" :key="bookmark.id" class="bookmark-item">
            <text class="bookmark-page">第 {{ bookmark.page }} 页</text>
            <button @click="goToPage(bookmark.page)" class="go-btn">跳转</button>
          </view>
        </view>
      </view>
      
      <view class="menu-section">
        <text class="menu-section-title">朗读设置</text>
        <view class="tts-controls">
          <button @click="toggleTTS" class="tts-btn">
            {{ isPlaying ? '暂停' : '开始朗读' }}
          </button>
          <button @click="stopTTS" class="tts-btn">停止</button>
        </view>
        <view class="tts-settings">
          <text class="setting-label">速度: {{ speechRate.toFixed(1) }}</text>
          <slider @change="setSpeechRate" :value="speechRate" :min="0.5" :max="2" :step="0.1" />
          <text class="setting-label">音量: {{ speechVolume.toFixed(1) }}</text>
          <slider @change="setSpeechVolume" :value="speechVolume" :min="0" :max="1" :step="0.1" />
        </view>
      </view>
      
      <button @click="showMenu = false" class="close-btn">关闭</button>
    </view>
    
    <!-- 底部控制栏 -->
    <view class="bottom-bar">
      <button @click="prevPage" class="control-btn">上一页</button>
      <text class="page-info">{{ currentPage }} / {{ totalPages }}</text>
      <button @click="nextPage" class="control-btn">下一页</button>
    </view>
  </view>
</template>

<script>
import { get, getErrorMessage } from '../../utils/http'
// #ifdef H5
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry'
// #endif

export default {
  data() {
    return {
      pdfId: '',
      pdfName: '',
      pdfDoc: null,
      pages: [],
      currentPage: 1,
      totalPages: 0,
      showMenu: false,
      // 字体设置
      fonts: ['默认', '宋体', '黑体'],
      currentFont: '默认',
      fontSize: 16,
      // 背景设置
      backgroundColors: [
        { name: '默认', value: '#ffffff' },
        { name: '护眼', value: '#e6e6fa' },
        { name: '夜间', value: '#1a1a1a' },
        { name: ' sepia', value: '#f5f5dc' }
      ],
      currentBackground: 0,
      // 书签
      bookmarks: [],
      // 朗读功能
      isPlaying: false,
      speechRate: 1.0,
      speechVolume: 1.0,
      speechInstance: null
    }
  },
  computed: {
    backgroundColor() {
      return this.backgroundColors[this.currentBackground].value
    },
    menuBackgroundColor() {
      return this.currentBackground === 2 ? '#2a2a2a' : '#ffffff'
    }
  },
  onLoad(options) {
    this.pdfId = options.id
    this.pdfName = options.name
    this.loadPDF()
  },
  methods: {
    async loadPDF() {
      // #ifndef H5
      uni.showToast({ title: '小程序端暂不支持PDF渲染，请使用H5访问', icon: 'none' })
      return
      // #endif

      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

        const data = await get(`/api/pdf/${this.pdfId}`, {
          header: {
            'Authorization': `Bearer ${this.$store.state.token}`
          },
          timeout: 15000
        })
        const pdfUrl = `/uploads/${data.pdf.filename}`
        
        const loadingTask = pdfjsLib.getDocument(pdfUrl)
        this.pdfDoc = await loadingTask.promise
        this.totalPages = this.pdfDoc.numPages
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1)
        
        // 渲染第一页
        this.renderPage(1)
        
        // 恢复阅读进度
        const savedProgress = this.$store.getters.getReadingProgress(this.pdfId)
        if (savedProgress > 0) {
          this.currentPage = Math.round(savedProgress * this.totalPages)
          this.renderPage(this.currentPage)
        }
      } catch (error) {
        console.error('加载PDF失败:', error)
        uni.showToast({ title: getErrorMessage(error, '加载PDF失败'), icon: 'none' })
      }
    },
    async renderPage(pageNum) {
      try {
        // #ifndef H5
        return
        // #endif
        const page = await this.pdfDoc.getPage(pageNum)
        const canvas = document.getElementById(`page-${pageNum}`)
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        const viewport = page.getViewport({ scale: 1.5 })
        
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        }
        
        await page.render(renderContext).promise
        
        // 保存阅读进度
        const progress = pageNum / this.totalPages
        this.$store.dispatch('saveReadingProgress', { pdfId: this.pdfId, progress })
      } catch (error) {
        console.error('渲染页面失败:', error)
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
        this.renderPage(this.currentPage)
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
        this.renderPage(this.currentPage)
      }
    },
    goToPage(pageNum) {
      if (pageNum >= 1 && pageNum <= this.totalPages) {
        this.currentPage = pageNum
        this.renderPage(this.currentPage)
        this.showMenu = false
      }
    },
    setFont(font) {
      this.currentFont = font
      // 这里可以实现字体切换逻辑
    },
    increaseFontSize() {
      if (this.fontSize < 24) {
        this.fontSize++
        // 这里可以实现字体大小调整逻辑
      }
    },
    decreaseFontSize() {
      if (this.fontSize > 12) {
        this.fontSize--
        // 这里可以实现字体大小调整逻辑
      }
    },
    setBackground(index) {
      this.currentBackground = index
    },
    addBookmark() {
      const bookmark = {
        id: Date.now(),
        page: this.currentPage,
        pdfId: this.pdfId
      }
      this.bookmarks.push(bookmark)
      this.$store.commit('addBookmark', bookmark)
      uni.showToast({ title: '书签添加成功', icon: 'success' })
    },
    goBack() {
      uni.navigateBack()
    },
    // 朗读功能
    async toggleTTS() {
      // #ifndef H5
      uni.showToast({ title: '小程序端暂不支持语音朗读', icon: 'none' })
      return
      // #endif

      if (this.isPlaying) {
        // 暂停朗读
        if (this.speechInstance) {
          this.speechInstance.pause()
        }
      } else {
        // 开始朗读
        const text = await this.getPageText(this.currentPage)
        this.speakText(text)
      }
      this.isPlaying = !this.isPlaying
    },
    stopTTS() {
      // #ifndef H5
      this.isPlaying = false
      return
      // #endif

      if (this.speechInstance) {
        this.speechInstance.cancel()
      }
      this.isPlaying = false
    },
    setSpeechRate(e) {
      this.speechRate = e.detail.value
      if (this.speechInstance) {
        this.speechInstance.rate = this.speechRate
      }
    },
    setSpeechVolume(e) {
      this.speechVolume = e.detail.value
      if (this.speechInstance) {
        this.speechInstance.volume = this.speechVolume
      }
    },
    async getPageText(pageNum) {
      try {
        const page = await this.pdfDoc.getPage(pageNum)
        const content = await page.getTextContent()
        const text = content.items.map(item => item.str).join(' ')
        return text
      } catch (error) {
        console.error('获取页面文本失败:', error)
        return ''
      }
    },
    speakText(text) {
      // #ifndef H5
      uni.showToast({ title: '当前设备不支持语音朗读', icon: 'none' })
      return
      // #endif

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = this.speechRate
        utterance.volume = this.speechVolume
        utterance.onend = () => {
          // 朗读结束后自动朗读下一页
          if (this.currentPage < this.totalPages) {
            this.currentPage++
            this.renderPage(this.currentPage)
            this.getPageText(this.currentPage).then(nextText => {
              this.speakText(nextText)
            })
          } else {
            this.isPlaying = false
          }
        }
        this.speechInstance = utterance
        window.speechSynthesis.speak(utterance)
      } else {
        uni.showToast({ title: '当前设备不支持语音朗读', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.reader-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  background-color: #f5f5f5;
  border-bottom: 1rpx solid #ddd;
}

.back-btn, .menu-btn {
  font-size: 32rpx;
  background: none;
  border: none;
  padding: 10rpx;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20rpx;
}

.page-container {
  margin-bottom: 20rpx;
  text-align: center;
}

.pdf-page {
  max-width: 100%;
  height: auto;
}

.menu-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 70%;
  height: 100vh;
  z-index: 999;
  padding: 40rpx;
  box-shadow: -5rpx 0 15rpx rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.menu-section {
  margin-bottom: 40rpx;
}

.menu-section-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #333;
}

.font-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 20rpx;
}

.font-btn {
  padding: 10rpx 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 24rpx;
  background-color: #f5f5f5;
}

.font-btn.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.font-size {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-top: 20rpx;
}

.size-btn {
  padding: 10rpx 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 24rpx;
  background-color: #f5f5f5;
}

.current-size {
  font-size: 24rpx;
  color: #333;
}

.background-options {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}

.background-item {
  width: 60rpx;
  height: 60rpx;
  border-radius: 8rpx;
  border: 2rpx solid #ddd;
}

.background-item.active {
  border-color: #4CAF50;
  box-shadow: 0 0 10rpx rgba(76, 175, 80, 0.5);
}

.bookmark-btn {
  width: 100%;
  padding: 20rpx;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 24rpx;
  margin-bottom: 20rpx;
}

.bookmark-list {
  margin-top: 20rpx;
}

.bookmark-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  margin-bottom: 10rpx;
}

.bookmark-page {
  font-size: 24rpx;
  color: #333;
}

.go-btn {
  padding: 10rpx 20rpx;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 20rpx;
}

.tts-controls {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.tts-btn {
  flex: 1;
  padding: 20rpx;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.tts-settings {
  margin-top: 20rpx;
}

.setting-label {
  font-size: 24rpx;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.close-btn {
  width: 100%;
  padding: 20rpx;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 24rpx;
  margin-top: 40rpx;
}

.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  background-color: #f5f5f5;
  border-top: 1rpx solid #ddd;
}

.control-btn {
  padding: 10rpx 20rpx;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.page-info {
  font-size: 24rpx;
  color: #333;
}
</style>