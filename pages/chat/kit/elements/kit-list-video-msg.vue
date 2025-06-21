<template>
	<view class="video-message" @click="handleClick">
		<view class="video-content">
			<image class="video-cover" :src="content.coverImage" mode="aspectFill" />
			<image class="play-icon" src="/static/icons/play.png" />
			<text class="duration">{{ formatDuration(content.duration) }}"</text>
		</view>
	</view>
</template>

<script lang="ts" setup>
	import { MessageContent } from '@/models/ChatMessage'

	const props = defineProps<{
		content: MessageContent
	}>()

	const emit = defineEmits<{
		(e: 'click', type: string, content: MessageContent): void
	}>()

	const formatDuration = (duration: number) => {
		const minutes = Math.floor(duration / 60)
		const seconds = Math.floor(duration % 60)
		return `${minutes}:${seconds.toString().padStart(2, '0')}`
	}

	const handleClick = () => {
		emit('click', 'video', props.content)
	}
</script>

<style lang="scss" scoped>
	.video-message {
		.video-content {
			position: relative;
			width: 400rpx;
			height: 300rpx;
			border-radius: 16rpx;
			overflow: hidden;
			box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
			
			.video-cover {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
			
			.play-icon {
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				width: 80rpx;
				height: 80rpx;
				opacity: 0.8;
			}
			
			.duration {
				position: absolute;
				right: 16rpx;
				bottom: 16rpx;
				padding: 4rpx 12rpx;
				background: rgba(0, 0, 0, 0.6);
				color: #fff;
				font-size: 24rpx;
				border-radius: 20rpx;
			}
		}
	}
</style>
