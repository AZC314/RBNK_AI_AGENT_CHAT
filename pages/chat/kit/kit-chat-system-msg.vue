<template>
	<view class="chat-item system">
		<view class="time-info">
			<text class="time">{{ formatTime(msg.time) }}</text>
		</view>
		<view class="bubble">
			<text class="text">{{ msg.content.text }}</text>
		</view>
		
	</view>
</template>

<script setup>
	import {
		DateTool
	} from '@/tools/dateTool'
	const props = defineProps({
		msg: Object
	})

	const formatTime = (timestamp) => {
		return DateTool.formatTimeAgo(DateTool.timestampToDate(timestamp))
	}
</script>

<style scoped>
	.chat-item.system {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 20rpx 0;
	}

	.bubble {
		background-color: rgba(0, 0, 0, 0.1);
		padding: 10rpx 20rpx;
		border-radius: 30rpx;
	}

	.text {
		font-size: 24rpx;
		color: #666;
	}

	.time-info {
		margin-top: 4rpx;
	}

	.time {
		font-size: 20rpx;
		color: #999;
	}
</style>