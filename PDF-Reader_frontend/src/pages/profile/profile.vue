<template>
  <view class="profile-container">
    <view v-if="!isLoggedIn" class="login-prompt">
      <text>请先登录</text>
      <button @click="goToLogin" class="login-btn">去登录</button>
    </view>
    <view v-else class="user-info">
      <view class="user-avatar">
        <text class="avatar-text">{{ currentUser.username.charAt(0).toUpperCase() }}</text>
      </view>
      <view class="user-details">
        <text class="username">{{ currentUser.username }}</text>
        <text class="email">{{ currentUser.email }}</text>
      </view>
      <view class="menu-list">
        <view class="menu-item" @click="goToUpload">
          <text class="menu-icon">📁</text>
          <text class="menu-text">上传PDF</text>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @click="logout">
          <text class="menu-icon">🚪</text>
          <text class="menu-text">退出登录</text>
          <text class="menu-arrow">→</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  computed: {
    isLoggedIn() {
      return this.$store.getters.isLoggedIn
    },
    currentUser() {
      return this.$store.getters.currentUser
    }
  },
  methods: {
    goToLogin() {
      uni.navigateTo({ url: '/pages/login/login' })
    },
    goToUpload() {
      uni.navigateTo({ url: '/pages/upload/upload' })
    },
    logout() {
      this.$store.dispatch('logout')
      uni.switchTab({ url: '/pages/login/login' })
    }
  }
}
</script>

<style scoped>
.profile-container {
  padding: 40rpx;
  height: 100vh;
}

.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
}

.login-btn {
  margin-top: 30rpx;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 32rpx;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background-color: #4CAF50;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}

.avatar-text {
  font-size: 64rpx;
  color: white;
  font-weight: bold;
}

.user-details {
  text-align: center;
  margin-bottom: 50rpx;
}

.username {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.email {
  font-size: 28rpx;
  color: #666;
}

.menu-list {
  width: 100%;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #eee;
}

.menu-icon {
  font-size: 36rpx;
  margin-right: 30rpx;
}

.menu-text {
  flex: 1;
  font-size: 32rpx;
}

.menu-arrow {
  font-size: 28rpx;
  color: #999;
}
</style>