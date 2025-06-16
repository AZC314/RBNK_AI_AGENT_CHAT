<template>
	<view class="session-item" :class="{ pinned: session.isPinned }" @click="navigateToChat">
		<!-- 头像及未读提示 -->
		<view class="avatar-container">
			<image v-if="session.avatarUrl" :src="session.avatarUrl" class="avatar" mode="aspectFill" />
			<view v-else class="avatar-placeholder">
				{{ getFirstChar(session.username) }}
			</view>

			<view v-if="session.unreadCount > 0" class="unread-badge">
				<text class="unread-count">{{ formatUnreadCount(session.unreadCount) }}</text>
			</view>
		</view>
		<!-- 内容 -->
		<view class="content">
			<view class="name-row">
				<text class="department" v-if="session.department">{{ session.department }}&nbsp;&nbsp;</text>
				<text class="name">{{ session.username }}</text>
			</view>
			<text class="last-message">{{ session.lastMessage }}</text>
		</view>
		<!-- 时间 -->
		<view class="time">
			{{ DateTool.formatTimeAgo(session.lastMessageTime) }}
		</view>
		<!-- 下边框线 -->
		<view class="bottom-border"></view>
	</view>
</template>

<script setup lang="ts">
	import { defineProps } from 'vue'
	import { DateTool } from '../tools/dateTool'
	import { SessionModel } from '@/models/sessionModel'
	import { Session } from 'inspector'

	const props = defineProps<{
		session : SessionModel
	}>()

	function getFirstChar(name : string) {
		return name ? name.charAt(0).toUpperCase() : ''
	}
	function formatUnreadCount(count : number) {
		if (count > 99) return '99+'
		return count.toString()
	}

	function navigateToChat() {
		// const id = encodeURIComponent(props.session.userId)
		// const title = encodeURIComponent(`${props.session.department} ${props.session.username}`)
		// url: `/pages/chat/chat?id=${id}&navbarTitle=${title}`
		uni.navigateTo({
			url: `/pages/chat/chat`
		})
	}
</script>

<style scoped>
	.session-item {
		display: flex;
		padding: 20rpx;
		background-color: #f9fafb;
		position: relative;
	}

	.session-item.pinned {
		background-color: #FFEDED !important;
		/* 添加 !important 确保样式生效 */
	}

	.avatar-container {
		width: 80rpx;
		height: 80rpx;
		margin-right: 20rpx;
		position: relative;
	}

	.avatar {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background-color: #1890ff;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		font-weight: bold;
	}

	.unread-badge {
		position: absolute;
		top: -6rpx;
		right: -6rpx;
		min-width: 32rpx;
		height: 32rpx;
		background-color: #ff4d4f;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 6rpx;
		box-sizing: border-box;
	}

	.unread-count {
		color: #fff;
		font-size: 20rpx;
		font-weight: bold;
		line-height: 1;
	}

	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
	}

	.name-row {
		display: flex;
		align-items: center;
		margin-bottom: 8rpx;
	}

	.department .name {
		font-size: 28rpx;
		color: #333;
		font-weight: normal;
	}

	.last-message {
		font-size: 26rpx;
		color: #999;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.time {
		font-size: 24rpx;
		color: #999;
		margin-left: 20rpx;
		white-space: nowrap;
	}

	/* 下边框线，左右有间距 */
	.bottom-border {
		position: absolute;
		left: 30rpx;
		right: 30rpx;
		bottom: 0;
		height: 3rpx;
		background-color: #e0e0e0;
		z-index: 1;
	}
</style>