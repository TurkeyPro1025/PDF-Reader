<template>
  <view class="login-container">
    <view class="logo">
      <text class="logo-text">PDF Reader</text>
    </view>
    <view class="form">
      <view class="form-item">
        <input type="text" v-model="form.username" placeholder="用户名" />
      </view>
      <view class="form-item">
        <input type="password" v-model="form.password" placeholder="密码" />
      </view>
      <view class="form-item">
        <button @click="login" class="login-btn">登录</button>
      </view>
      <view class="form-item">
        <button @click="register" class="register-btn">注册</button>
      </view>
    </view>
  </view>
</template>

<script>
import { post, getErrorMessage } from '../../utils/http'

export default {
  data() {
    return {
      form: {
        username: '',
        password: ''
      }
    } 
  },
  methods: {
    async login() {
      try {
        const data = await post('/api/auth/login', this.form)
        const { user, token } = data
        this.$store.dispatch('login', { user, token })
        uni.switchTab({ url: '/pages/profile/profile' })
      } catch (error) {
        uni.showToast({ title: getErrorMessage(error, '登录失败'), icon: 'none' })
      }
    },
    async register() {
      try {
        await post('/api/auth/register', this.form)
        uni.showToast({ title: '注册成功', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: getErrorMessage(error, '注册失败'), icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  padding: 60rpx 40rpx;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  margin-bottom: 100rpx;
}

.logo-text {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.form {
  width: 100%;
}

.form-item {
  margin-bottom: 30rpx;
}

input {
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 32rpx;
  width: 100%;
}

.login-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 32rpx;
  width: 100%;
}

.register-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 32rpx;
  width: 100%;
}
</style>