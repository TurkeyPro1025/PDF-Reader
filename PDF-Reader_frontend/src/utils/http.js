let DEFAULT_API_BASE_URL = 'http://127.0.0.1:3000'

function normalizeApiBaseUrl(url) {
  if (!url) {
    return ''
  }
  return url.replace(/\/$/, '')
}

function getApiBaseUrl() {
  const runtimeUrl = uni.getStorageSync('API_BASE_URL')
  return normalizeApiBaseUrl(runtimeUrl || DEFAULT_API_BASE_URL)
}

export function setApiBaseUrl(url) {
  DEFAULT_API_BASE_URL = normalizeApiBaseUrl(url) || DEFAULT_API_BASE_URL
}

export function buildApiUrl(path) {
  if (!path) {
    return getApiBaseUrl()
  }
  if (/^https?:\/\//i.test(path)) {
    return path
  }
  const baseUrl = getApiBaseUrl()
  if (path.startsWith('/')) {
    return `${baseUrl}${path}`
  }
  return `${baseUrl}/${path}`
}

export function getErrorMessage(error, fallback = '请求失败') {
  if (!error) {
    return fallback
  }
  if (typeof error === 'string') {
    return error
  }

  const errMsg = error.errMsg || error.message
  if (errMsg) {
    if (/timeout/i.test(errMsg)) {
      return '请求超时，请检查网络或稍后重试'
    }
    return errMsg
  }

  const data = error.data || error.response?.data
  if (data?.message) {
    return data.message
  }

  return fallback
}

export function request({
  url,
  method = 'GET',
  data,
  header = {},
  timeout = 15000
}) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: buildApiUrl(url),
      method,
      data,
      header,
      timeout,
      success: (res) => {
        const statusCode = res?.statusCode || 0
        if (statusCode >= 200 && statusCode < 300) {
          resolve(res.data)
          return
        }

        reject({
          statusCode,
          data: res?.data,
          errMsg: res?.data?.message || `HTTP ${statusCode}`
        })
      },
      fail: (err) => {
        reject(err || { errMsg: 'request:fail unknown error' })
      }
    })
  })
}

export function get(url, options = {}) {
  return request({ ...options, url, method: 'GET' })
}

export function post(url, data, options = {}) {
  return request({ ...options, url, data, method: 'POST' })
}
