<template>
  <view class="login-container">
    <view class="logo">
      <text class="logo-text">图书库</text>
      <text class="logo-subtitle">手机号主登录，管理员管理图书与兑换码</text>
    </view>
    <view class="mode-switch">
      <button :class="['switch-btn', mode === 'login' ? 'active' : '']" @click="mode = 'login'">登录</button>
      <button :class="['switch-btn', mode === 'register' ? 'active' : '']" @click="mode = 'register'">注册</button>
    </view>
    <view class="form">
      <view v-if="mode === 'register'" class="form-item">
        <input type="text" v-model="form.username" placeholder="用户名" />
      </view>
      <view v-if="mode === 'register'" class="form-item">
        <input type="number" v-model="form.phone" placeholder="手机号" />
      </view>
      <view v-if="mode === 'register'" class="form-item">
        <input type="text" v-model="form.email" placeholder="邮箱（可选）" />
      </view>
      <view v-if="mode === 'login'" class="form-item">
        <input type="text" v-model="form.account" placeholder="手机号或邮箱" />
      </view>
      <view class="form-item">
        <input type="password" v-model="form.password" placeholder="密码" />
      </view>
      <view class="form-item">
        <button @click="submit" class="login-btn">{{ mode === 'login' ? '登录' : '注册' }}</button>
      </view>
    </view>
  </view>
</template>

<script>
import { post, getErrorMessage } from '../../utils/http'

export default {
  data() {
    return {
      mode: 'login',
      form: {
        username: '',
        phone: '',
        email: '',
        account: '',
        password: ''
      }
    }
  },
  methods: {
    async submit() {
      if (this.mode === 'login') {
        await this.login()
        return
      }
      await this.register()
    },
    async login() {
      try {
        const data = await post('/api/auth/login', {
          account: this.form.account,
          password: this.form.password
        })
        const { user, token } = data
        this.$store.dispatch('login', { user, token })
        uni.reLaunch({ url: '/pages/index/index' })
      } catch (error) {
        uni.showToast({ title: getErrorMessage(error, '登录失败'), icon: 'none' })
      }
    },
    async register() {
      try {
        await post('/api/auth/register', {
          username: this.form.username,
          phone: this.form.phone,
          email: this.form.email,
          password: this.form.password
        })
        uni.showToast({ title: '注册成功', icon: 'success' })
        this.mode = 'login'
        this.form.account = this.form.phone
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
  margin-bottom: 40rpx;
  text-align: center;
}

.logo-text {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.logo-subtitle {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #666;
}

.mode-switch {
  width: 100%;
  display: flex;
  margin-bottom: 30rpx;
  background: #eef1f5;
  border-radius: 12rpx;
  padding: 8rpx;
}

.switch-btn {
  flex: 1;
  background: transparent;
  color: #666;
  border: none;
}

.switch-btn.active {
  background: #ffffff;
  color: #111;
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
</style>