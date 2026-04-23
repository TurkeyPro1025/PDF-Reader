import { createStore } from 'vuex'

const STORAGE_KEYS = {
  user: 'PDF_READER_USER',
  token: 'PDF_READER_TOKEN',
  readingProgress: 'PDF_READER_READING_PROGRESS',
  bookmarks: 'PDF_READER_BOOKMARKS'
}

function readStorage(key, fallback) {
  try {
    const value = uni.getStorageSync(key)
    return value === '' || value === undefined || value === null ? fallback : value
  } catch (error) {
    return fallback
  }
}

function writeStorage(key, value) {
  uni.setStorageSync(key, value)
}

function removeStorage(key) {
  uni.removeStorageSync(key)
}

export default createStore({
  state: {
    user: readStorage(STORAGE_KEYS.user, null),
    token: readStorage(STORAGE_KEYS.token, ''),
    currentPDF: null,
    readingProgress: readStorage(STORAGE_KEYS.readingProgress, {}),
    bookmarks: readStorage(STORAGE_KEYS.bookmarks, [])
  },
  mutations: {
    setUser(state, user) {
      state.user = user
      if (user) {
        writeStorage(STORAGE_KEYS.user, user)
      } else {
        removeStorage(STORAGE_KEYS.user)
      }
    },
    setToken(state, token) {
      state.token = token
      if (token) {
        writeStorage(STORAGE_KEYS.token, token)
      } else {
        removeStorage(STORAGE_KEYS.token)
      }
    },
    setCurrentPDF(state, pdf) {
      state.currentPDF = pdf
    },
    updateReadingProgress(state, { pdfId, progress }) {
      state.readingProgress[pdfId] = progress
      writeStorage(STORAGE_KEYS.readingProgress, state.readingProgress)
    },
    addBookmark(state, bookmark) {
      const exists = state.bookmarks.some((item) => item.pdfId === bookmark.pdfId && item.page === bookmark.page)
      if (!exists) {
        state.bookmarks.push(bookmark)
        writeStorage(STORAGE_KEYS.bookmarks, state.bookmarks)
      }
    },
    removeBookmark(state, bookmarkId) {
      state.bookmarks = state.bookmarks.filter(b => b.id !== bookmarkId)
      writeStorage(STORAGE_KEYS.bookmarks, state.bookmarks)
    }
  },
  actions: {
    login({ commit }, { user, token }) {
      commit('setUser', user)
      commit('setToken', token)
    },
    logout({ commit }) {
      commit('setUser', null)
      commit('setToken', '')
    },
    saveReadingProgress({ commit }, { pdfId, progress }) {
      commit('updateReadingProgress', { pdfId, progress })
    },
    addBookmark({ commit }, bookmark) {
      commit('addBookmark', bookmark)
    }
  },
  getters: {
    isLoggedIn: state => !!state.token,
    isAdmin: state => state.user?.role === 'admin',
    currentUser: state => state.user,
    getReadingProgress: state => pdfId => state.readingProgress[pdfId] || 0,
    getBookmarksByPdf: state => pdfId => state.bookmarks.filter(bookmark => bookmark.pdfId === pdfId)
  }
})