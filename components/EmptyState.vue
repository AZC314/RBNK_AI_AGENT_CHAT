<template>
	<view class="empty-state" :style="{ backgroundColor: bgc}">
		<image v-if="showImage" class="empty-icon" :src="imageSrc" mode="aspectFit" />
		<text class="empty-text">{{ message }}</text>
	</view>
</template>

<script setup>
	import {
		defineProps
	} from 'vue'

	defineProps({
		showImage: {
			type: Boolean,
			default: true
		},
		imageSrc: {
			type: String
		},
		message: {
			type: String,
			default: '暂无数据'
		},
		bgc:{
			type: String,
			default:'#f8f8f8'
		}
	})
</script>

<style scoped>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1 1 auto;
	}

	.empty-icon {
		width: 120rpx;
		height: 120rpx;
		margin-bottom: 20rpx;
		opacity: 0.6;
	}

	.empty-text {
		font-size: 28rpx;
		color: #999;
	}
</style>