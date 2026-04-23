<template>
	<view class="bookshelf-page">
		<view v-if="!isLoggedIn" class="empty-block">
			<text class="title">请先登录后查看书架</text>
			<button class="primary-btn" @click="goToLogin">去登录</button>
		</view>
		<view v-else>
			<view class="hero-card">
				<view>
					<text class="hero-title">我的书架</text>
					<text class="hero-subtitle">{{ currentUser.username }}，欢迎回来</text>
				</view>
				<button v-if="isAdmin" class="manage-btn" @click="goToManage">管理图书</button>
			</view>

			<view class="redeem-card">
				<text class="section-title">兑换图书</text>
				<input v-model="redeemCode" class="code-input" placeholder="输入兑换码" />
				<button class="primary-btn" @click="redeemBook">立即兑换</button>
			</view>

			<view v-if="recentReads.length" class="section-block">
				<text class="section-title">最近阅读</text>
				<view class="book-strip">
					<view v-for="book in recentReads" :key="book.id" class="book-chip" @click="openBook(book)">
						<text class="book-chip-title">{{ book.title }}</text>
						<text class="book-chip-subtitle">进度 {{ Math.round(book.progress || 0) }}%</text>
					</view>
				</view>
			</view>

			<view v-if="categories.length" class="section-block">
				<text class="section-title">分类</text>
				<view class="category-row">
					<view class="category-chip" :class="{ active: activeCategory === '' }" @click="activeCategory = ''">全部</view>
					<view
						v-for="item in categories"
						:key="item.name"
						class="category-chip"
						:class="{ active: activeCategory === item.name }"
						@click="activeCategory = item.name"
					>
						{{ item.name }}({{ item.count }})
					</view>
				</view>
			</view>

			<view class="section-block">
				<text class="section-title">已拥有图书</text>
				<view v-if="filteredBooks.length === 0" class="empty-block small">
					<text class="empty-text">书架还是空的，先去兑换一本吧。</text>
				</view>
				<view v-for="book in filteredBooks" :key="book.id" class="book-card">
					<view class="book-card-main">
						<text class="book-title">{{ book.title }}</text>
						<text class="book-meta">{{ book.author }} · {{ book.category }}</text>
						<text class="book-meta">阅读进度 {{ Math.round(book.progress || 0) }}%</text>
						<text v-if="book.status !== 'active'" class="book-meta warning-text">当前状态：{{ book.status === 'archived' ? '已归档，已拥有用户仍可阅读' : '已下架，暂停新兑换' }}</text>
					</view>
					<view class="book-actions">
						<button class="mini-btn" @click="openBook(book)">阅读</button>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { get, getErrorMessage, post } from '../../utils/http'

	export default {
		data() {
			return {
				redeemCode: '',
				bookshelf: [],
				recentReads: [],
				categories: [],
				activeCategory: ''
			}
		},
		computed: {
			isLoggedIn() {
				return this.$store.getters.isLoggedIn
			},
			isAdmin() {
				return this.$store.getters.isAdmin
			},
			currentUser() {
				return this.$store.getters.currentUser || { username: '' }
			},
			filteredBooks() {
				if (!this.activeCategory) {
					return this.bookshelf
				}
				return this.bookshelf.filter((book) => book.category === this.activeCategory)
			}
		},
		onShow() {
			if (!this.isLoggedIn) {
				return
			}
			this.loadBookshelf()
		},
		methods: {
			goToLogin() {
				uni.navigateTo({ url: '/pages/login/login' })
			},
			goToManage() {
				uni.navigateTo({ url: '/pages/upload/upload' })
			},
			async loadBookshelf() {
				try {
					const data = await get('/api/bookshelf', {
						header: {
							Authorization: `Bearer ${this.$store.state.token}`
						}
					})
					this.bookshelf = data.bookshelf || []
					this.recentReads = data.recentReads || []
					this.categories = data.categories || []
				} catch (error) {
					uni.showToast({ title: getErrorMessage(error, '加载书架失败'), icon: 'none' })
				}
			},
			async redeemBook() {
				if (!this.redeemCode) {
					uni.showToast({ title: '请输入兑换码', icon: 'none' })
					return
				}
				try {
					await post('/api/bookshelf/redeem', { code: this.redeemCode }, {
						header: {
							Authorization: `Bearer ${this.$store.state.token}`
						}
					})
					this.redeemCode = ''
					uni.showToast({ title: '兑换成功', icon: 'success' })
					this.loadBookshelf()
				} catch (error) {
					uni.showToast({ title: getErrorMessage(error, '兑换失败'), icon: 'none' })
				}
			},
			openBook(book) {
				uni.navigateTo({
					url: `/pages/reader/reader?id=${book.id}&name=${book.title}`
				})
			}
		}
	}
</script>

<style>
	.bookshelf-page {
		padding: 32rpx;
		min-height: 100vh;
		background: #f6f7fb;
	}

	.hero-card,
	.redeem-card,
	.book-card,
	.section-block {
		background: #fff;
		border-radius: 24rpx;
		padding: 28rpx;
		margin-bottom: 24rpx;
	}

	.hero-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.hero-title,
	.title,
	.section-title,
	.book-title,
	.record-title {
		display: block;
	}

	.hero-title {
		font-size: 42rpx;
		font-weight: 700;
		color: #111;
	}

	.hero-subtitle,
	.book-chip-subtitle,
	.book-meta,
	.empty-text {
		display: block;
		font-size: 24rpx;
		color: #666;
		margin-top: 8rpx;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: 700;
		margin-bottom: 16rpx;
	}

	.primary-btn,
	.manage-btn,
	.mini-btn {
		background: #1f6feb;
		color: #fff;
		border: none;
		border-radius: 12rpx;
	}

	.manage-btn {
		background: #111827;
		font-size: 24rpx;
		padding: 0 24rpx;
	}

	.code-input {
		border: 1rpx solid #d0d7de;
		border-radius: 14rpx;
		padding: 22rpx;
		background: #f9fafb;
		margin-bottom: 16rpx;
	}

	.book-strip,
	.category-row {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	.book-chip,
	.category-chip {
		padding: 16rpx 20rpx;
		border-radius: 16rpx;
		background: #eef2ff;
		color: #3730a3;
		font-size: 24rpx;
	}

	.category-chip.active {
		background: #1f6feb;
		color: #fff;
	}

	.book-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.book-card-main {
		flex: 1;
		padding-right: 20rpx;
	}

	.book-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #111;
	}

	.book-actions {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.warning-text {
		color: #b45309;
	}

	.mini-btn {
		font-size: 24rpx;
		padding: 0 20rpx;
	}

	.empty-block {
		padding: 80rpx 40rpx;
		text-align: center;
	}

	.empty-block.small {
		padding: 40rpx 20rpx;
	}
</style>
