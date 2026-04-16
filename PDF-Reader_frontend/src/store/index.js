import { createStore } from 'vuex'

export default createStore({
  state: {
    user: null,
    token: '',
    currentPDF: null,
    readingProgress: {},
    bookmarks: []
  },
  mutations: {
    setUser(state, user) {
      state.user = user
    },
    setToken(state, token) {
      state.token = token
    },
    setCurrentPDF(state, pdf) {
      state.currentPDF = pdf
    },
    updateReadingProgress(state, { pdfId, progress }) {
      state.readingProgress[pdfId] = progress
    },
    addBookmark(state, bookmark) {
      state.bookmarks.push(bookmark)
    },
    removeBookmark(state, bookmarkId) {
      state.bookmarks = state.bookmarks.filter(b => b.id !== bookmarkId)
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
    }
  },
  getters: {
    isLoggedIn: state => !!state.token,
    currentUser: state => state.user,
    getReadingProgress: state => pdfId => state.readingProgress[pdfId] || 0
  }
})