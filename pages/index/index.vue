<template>
	<view class="login-container">
		<view class="login-form">
			<text class="title">用户登录</text>

			<!-- 用户名输入 -->
			<view class="input-group">
				<text class="label">用户名</text>
				<input v-model="form.username" placeholder="请输入用户名" class="input" @blur="validate('username')" />
				<text class="error" v-if="errors.username">{{ errors.username }}</text>
			</view>

			<!-- 密码输入 -->
			<view class="input-group">
				<text class="label">密码</text>
				<input v-model="form.password" placeholder="请输入密码" password class="input"
					@blur="validate('password')" />
				<text class="error" v-if="errors.password">{{ errors.password }}</text>
			</view>

			<!-- 登录按钮 -->
			<button class="login-btn" :disabled="isSubmitting" @click="handleLogin">
				{{ isSubmitting ? '登录中...' : '登录' }}
			</button>
		</view>
	</view>
</template>
<script setup>
	import {
		ref
	} from 'vue';
	import {
		onLoad
	} from '@dcloudio/uni-app';
	import {
		POSYT_LOGIN
	} from '@/api/api'
	import {
		AppStorage
	} from '@/stores/AppStorage';
	import {
		REF_TOKEN,
		TOKEN
	} from '@/constances/constances';
	import GeneralServices from '@/api/GeneralServices'

	// 表单数据
	const form = ref({
		username: '',
		password: ''
	});

	// 错误提示
	const errors = ref({
		username: '',
		password: ''
	});

	// 提交状态
	const isSubmitting = ref(false);

	// 表单验证规则
	const rules = {
		username: [{
			required: true,
			message: '用户名不能为空'
		}],
		password: [{
				required: true,
				message: '密码不能为空'
			},
			{
				minLength: 6,
				message: '密码至少6位'
			}
		]
	};

	// 验证单个字段
	const validate = (field) => {
		const value = form.value[field];
		const fieldRules = rules[field];

		for (const rule of fieldRules) {
			if (rule.required && !value) {
				errors.value[field] = rule.message;
				return false;
			}
			if (rule.minLength && value.length < rule.minLength) {
				errors.value[field] = rule.message;
				return false;
			}
		}

		errors.value[field] = '';
		return true;
	};

	// 提交登录
	const handleLogin = async () => {
		// 验证所有字段
		const isValid = Object.keys(form.value).every(field => validate(field));
		if (!isValid) return;

		isSubmitting.value = true;

		try {
			POSYT_LOGIN(new Object({
				username: form.value.username,
				password: form.value.password
			})).then(res => {
				if (res.detail) {
					uni.showToast({
						title: res.detail,
						icon: 'error'
					});
				} else {
					if (res.access_token) AppStorage.set(TOKEN, res.access_token)
					if (res.refresh_token) AppStorage.set(REF_TOKEN, res.refresh_token)
					GeneralServices.globalInitialization()
					// 登录成功处理
					uni.showToast({
						title: '登录成功',
						icon: 'success',
						duration: 1000
					});
					uni.switchTab({
						url: "/pages/message/message"
					});
				}
			})



		} catch (error) {
			uni.showToast({
				title: '登录失败',
				icon: 'error'
			});
		} finally {
			isSubmitting.value = false;
		}
	};

	// 页面加载时自动聚焦用户名输入框（H5/App生效）
	onLoad(() => {
    GeneralServices.clearStore()
		// #ifdef H5 || APP
		document.querySelector('.input')?.focus();
		// #endif
	});
</script>
<style scoped>
	.login-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		background-color: #f5f5f5;
	}

	.login-form {
		width: 80%;
		padding: 40rpx;
		background: #fff;
		border-radius: 16rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}

	.title {
		font-size: 36rpx;
		font-weight: bold;
		text-align: center;
		margin-bottom: 40rpx;
		display: block;
	}

	.input-group {
		margin-bottom: 30rpx;
	}

	.label {
		display: block;
		margin-bottom: 10rpx;
		font-size: 28rpx;
		color: #333;
	}

	.input {
		width: 100%;
		height: 80rpx;
		padding: 0 20rpx;
		border: 1rpx solid #ddd;
		border-radius: 8rpx;
		font-size: 28rpx;
	}

	.error {
		color: red;
		font-size: 24rpx;
		margin-top: 8rpx;
		display: block;
	}

	.login-btn {
		margin-top: 40rpx;
		background-color: #007aff;
		color: white;
		border: none;
		height: 80rpx;
		border-radius: 8rpx;
		font-size: 30rpx;
	}

	.login-btn:disabled {
		background-color: #cccccc;
	}
</style>