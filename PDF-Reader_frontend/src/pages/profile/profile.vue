<template>
  <view class="profile-container">
    <view v-if="!isLoggedIn" class="login-prompt">
      <text>请先登录</text>
      <button @click="goToLogin" class="login-btn">去登录</button>
    </view>
    <view v-else class="user-info">
      <view class="user-avatar">
        <text class="avatar-text">{{ avatarText }}</text>
      </view>
      <view class="user-details">
        <text class="username">{{ currentUser.username }}</text>
        <text class="email">手机号：{{ currentUser.phone }}</text>
        <text v-if="currentUser.email" class="email">邮箱：{{ currentUser.email }}</text>
        <text class="role-tag">{{ isAdmin ? '管理员' : '普通用户' }}</text>
      </view>
      <view class="menu-list">
        <view class="menu-item" @click="goToShelf">
          <text class="menu-icon">📚</text>
          <text class="menu-text">书架首页</text>
          <text class="menu-arrow">→</text>
        </view>
        <view v-if="isAdmin" class="menu-item" @click="goToUpload">
          <text class="menu-icon">🛠</text>
          <text class="menu-text">图书与兑换码管理</text>
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
    isAdmin() {
      return this.$store.getters.isAdmin
    },
    currentUser() {
      return this.$store.getters.currentUser || { username: '', email: '', phone: '' }
    },
    avatarText() {
      return this.currentUser.username ? this.currentUser.username.charAt(0).toUpperCase() : 'P'
    }
  },
  methods: {
    goToLogin() {
      uni.navigateTo({ url: '/pages/login/login' })
    },
    goToShelf() {
      uni.reLaunch({ url: '/pages/index/index' })
    },
    goToUpload() {
      uni.navigateTo({ url: '/pages/upload/upload' })
    },
    logout() {
      this.$store.dispatch('logout')
      uni.reLaunch({ url: '/pages/login/login' })
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
  display: block;
  margin-top: 8rpx;
}

.role-tag {
  display: inline-block;
  margin-top: 16rpx;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 24rpx;
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