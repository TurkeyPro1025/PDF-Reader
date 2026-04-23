<template>
  <view class="reader-container" :style="{ backgroundColor }">
    <view class="navbar">
      <button @click="goBack" class="back-btn">←</button>
      <text class="title">{{ pdfName || '阅读器' }}</text>
      <button @click="showMenu = !showMenu" class="menu-btn">☰</button>
    </view>

    <view class="content">
      <canvas id="pdf-page" class="pdf-page"></canvas>
    </view>

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
          <button @click="toggleTTS" class="tts-btn">{{ isPlaying && !isPaused ? '暂停' : '开始朗读' }}</button>
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

    <view class="bottom-bar">
      <button @click="prevPage" class="control-btn">上一页</button>
      <text class="page-info">{{ currentPage }} / {{ totalPages || 1 }}</text>
      <button @click="nextPage" class="control-btn">下一页</button>
    </view>
  </view>
</template>

<script>
import { buildAssetUrl, get, getErrorMessage, put } from '../../utils/http'
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
      currentPage: 1,
      totalPages: 0,
      showMenu: false,
      fonts: ['默认', '宋体', '黑体'],
      currentFont: '默认',
      fontSize: 16,
      backgroundColors: [
        { name: '默认', value: '#ffffff' },
        { name: '护眼', value: '#eef8ea' },
        { name: '夜间', value: '#1a1a1a' },
        { name: '复古', value: '#f5ecd9' }
      ],
      currentBackground: 0,
      localBookmarks: [],
      isPlaying: false,
      isPaused: false,
      speechRate: 1.0,
      speechVolume: 1.0,
      speechInstance: null,
      isSyncing: false
    }
  },
  computed: {
    backgroundColor() {
      return this.backgroundColors[this.currentBackground].value
    },
    menuBackgroundColor() {
      return this.currentBackground === 2 ? '#2a2a2a' : '#ffffff'
    },
    bookmarks() {
      return this.localBookmarks
    }
  },
  onLoad(options) {
    this.pdfId = options.id || ''
    this.pdfName = options.name || ''
    if (!this.ensureLoggedIn()) {
      return
    }
    this.loadPDF()
  },
  onUnload() {
    this.stopTTS()
  },
  methods: {
    ensureLoggedIn() {
      if (this.$store.getters.isLoggedIn) {
        return true
      }
      uni.showToast({ title: '请先登录', icon: 'none' })
      uni.reLaunch({ url: '/pages/login/login' })
      return false
    },
    resolveBookFileUrl(book) {
      if (!book) {
        return ''
      }
      if (book.fileUrl) {
        return buildAssetUrl(book.fileUrl)
      }
      if (book.path) {
        return buildAssetUrl(`/${String(book.path).replace(/^\/+/, '').replace(/\\/g, '/')}`)
      }
      if (book.filename) {
        return buildAssetUrl(`/uploads/${book.filename}`)
      }
      return ''
    },
    async loadPDF() {
      // #ifndef H5
      uni.showToast({ title: '小程序端暂不支持PDF渲染，请使用H5访问', icon: 'none' })
      return
      // #endif

      if (!this.pdfId) {
        uni.showToast({ title: '缺少图书信息', icon: 'none' })
        return
      }

      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

        const data = await get(`/api/books/${this.pdfId}/read`, {
          header: {
            Authorization: `Bearer ${this.$store.state.token}`
          },
          timeout: 15000
        })

        const pdfUrl = this.resolveBookFileUrl(data.book)
        if (!pdfUrl) {
          throw new Error('图书文件地址无效')
        }

        this.pdfName = data.book.title || this.pdfName
        this.localBookmarks = data.readingState?.bookmarks || []

        const loadingTask = pdfjsLib.getDocument(pdfUrl)
        this.pdfDoc = await loadingTask.promise
        this.totalPages = this.pdfDoc.numPages
        this.currentPage = Math.min(
          this.totalPages,
          Math.max(1, data.readingState?.lastPage || 1)
        )

        await this.renderCurrentPage()
      } catch (error) {
        console.error('加载PDF失败:', error)
        uni.showToast({ title: getErrorMessage(error, '加载PDF失败'), icon: 'none' })
      }
    },
    async renderCurrentPage() {
      try {
        // #ifndef H5
        return
        // #endif
        if (!this.pdfDoc) {
          return
        }

        await this.$nextTick()

        const page = await this.pdfDoc.getPage(this.currentPage)
        const canvas = document.getElementById('pdf-page')
        if (!canvas) {
          return
        }

        const containerWidth = Math.max(window.innerWidth - 32, 320)
        const unscaledViewport = page.getViewport({ scale: 1 })
        const scale = Math.min(2, Math.max(1, containerWidth / unscaledViewport.width))
        const viewport = page.getViewport({ scale })
        const ctx = canvas.getContext('2d')

        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({
          canvasContext: ctx,
          viewport
        }).promise

        await this.syncReadingState()
      } catch (error) {
        console.error('渲染页面失败:', error)
      }
    },
    async syncReadingState() {
      if (this.isSyncing || !this.pdfId) {
        return
      }

      this.isSyncing = true
      try {
        await put(`/api/bookshelf/${this.pdfId}/progress`, {
          progress: this.totalPages > 0 ? (this.currentPage / this.totalPages) * 100 : 0,
          lastPage: this.currentPage,
          bookmarks: this.localBookmarks
        }, {
          header: {
            Authorization: `Bearer ${this.$store.state.token}`
          }
        })
      } catch (error) {
        console.error('同步阅读状态失败:', error)
      } finally {
        this.isSyncing = false
      }
    },
    async prevPage() {
      if (this.currentPage <= 1) {
        return
      }
      this.currentPage -= 1
      await this.renderCurrentPage()
    },
    async nextPage() {
      if (this.currentPage >= this.totalPages) {
        return
      }
      this.currentPage += 1
      await this.renderCurrentPage()
    },
    async goToPage(pageNum) {
      if (pageNum < 1 || pageNum > this.totalPages) {
        return
      }
      this.currentPage = pageNum
      this.showMenu = false
      await this.renderCurrentPage()
    },
    setFont(font) {
      this.currentFont = font
    },
    increaseFontSize() {
      if (this.fontSize < 24) {
        this.fontSize += 1
      }
    },
    decreaseFontSize() {
      if (this.fontSize > 12) {
        this.fontSize -= 1
      }
    },
    setBackground(index) {
      this.currentBackground = index
    },
    addBookmark() {
      const bookmark = {
        id: String(Date.now()),
        page: this.currentPage,
        label: `第 ${this.currentPage} 页`,
        createdAt: new Date().toISOString()
      }
      const exists = this.localBookmarks.some((item) => item.page === bookmark.page)
      if (!exists) {
        this.localBookmarks = [...this.localBookmarks, bookmark]
        this.syncReadingState()
      }
      uni.showToast({ title: exists ? '该页已存在书签' : '书签添加成功', icon: 'none' })
    },
    goBack() {
      uni.navigateBack()
    },
    async getPageText(pageNum) {
      // #ifndef H5
      return ''
      // #endif
      if (!this.pdfDoc) {
        return ''
      }

      const page = await this.pdfDoc.getPage(pageNum)
      const textContent = await page.getTextContent()
      return textContent.items.map((item) => item.str).join(' ')
    },
    speakText(text) {
      // #ifndef H5
      return
      // #endif
      if (!window.speechSynthesis) {
        uni.showToast({ title: '当前浏览器不支持语音朗读', icon: 'none' })
        return
      }

      this.stopTTS()
      this.speechInstance = new SpeechSynthesisUtterance(text || '当前页面无可朗读文本')
      this.speechInstance.rate = this.speechRate
      this.speechInstance.volume = this.speechVolume
      this.speechInstance.onend = () => {
        this.isPlaying = false
        this.isPaused = false
        this.speechInstance = null
      }
      window.speechSynthesis.speak(this.speechInstance)
      this.isPlaying = true
    },
    async toggleTTS() {
      // #ifndef H5
      uni.showToast({ title: '小程序端暂不支持语音朗读', icon: 'none' })
      return
      // #endif

      if (this.isPlaying) {
        if (this.isPaused) {
          window.speechSynthesis.resume()
          this.isPaused = false
        } else {
          window.speechSynthesis.pause()
          this.isPaused = true
        }
        return
      }

      const text = await this.getPageText(this.currentPage)
      this.speakText(text)
      this.isPaused = false
    },
    stopTTS() {
      // #ifdef H5
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      // #endif
      this.isPlaying = false
      this.isPaused = false
      this.speechInstance = null
    },
    setSpeechRate(event) {
      this.speechRate = Number(event?.detail?.value || 1)
      if (this.speechInstance) {
        this.speechInstance.rate = this.speechRate
      }
    },
    setSpeechVolume(event) {
      this.speechVolume = Number(event?.detail?.value || 1)
      if (this.speechInstance) {
        this.speechInstance.volume = this.speechVolume
      }
    }
  }
}
</script>

<style>
.reader-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: #111827;
  color: #fff;
}

.back-btn,
.menu-btn,
.control-btn,
.font-btn,
.size-btn,
.bookmark-btn,
.go-btn,
.tts-btn,
.close-btn {
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 12rpx;
}

.title {
  flex: 1;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  padding: 0 20rpx;
}

.content {
  flex: 1;
  overflow: auto;
  padding: 16rpx;
}

.pdf-page {
  width: 100%;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 12rpx 24rpx rgba(15, 23, 42, 0.08);
}

.menu-panel {
  position: fixed;
  right: 24rpx;
  top: 120rpx;
  width: 680rpx;
  max-width: calc(100vw - 48rpx);
  max-height: calc(100vh - 220rpx);
  overflow-y: auto;
  padding: 24rpx;
  border-radius: 24rpx;
  box-shadow: 0 16rpx 40rpx rgba(15, 23, 42, 0.18);
  z-index: 20;
}

.menu-section {
  margin-bottom: 24rpx;
}

.menu-section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.font-options,
.background-options,
.tts-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.font-size,
.tts-settings {
  margin-top: 16rpx;
}

.current-size,
.setting-label,
.bookmark-page {
  display: block;
  margin: 12rpx 0;
}

.background-item {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  border: 4rpx solid transparent;
}

.background-item.active,
.font-btn.active {
  outline: 4rpx solid #2563eb;
}

.bookmark-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 16rpx;
}

.bookmark-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx;
  background: rgba(148, 163, 184, 0.12);
  border-radius: 16rpx;
}

.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx 32rpx;
  background: rgba(255, 255, 255, 0.92);
  border-top: 1rpx solid #e5e7eb;
}

.page-info {
  font-size: 28rpx;
  font-weight: 600;
  color: #111827;
}
</style>
