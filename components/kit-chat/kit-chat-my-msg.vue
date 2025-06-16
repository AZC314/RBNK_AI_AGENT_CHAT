<template>
	<view class="chat-item my">
		<image class="avatar" :src="msg.userinfo.face" />
		<view class="message-wrapper">
			<view class="bubble" :class="{ 'is-media': isMediaMsg }">
				<component :is="resolveComponent()" :content="msg.content" @click="handleMessageClick" />
			</view>
			<text class="time">{{ formatTime(msg.time) }}</text>
		</view>
	</view>
</template>

<script lang="ts" setup>
	import { DateTool } from '@/tools/dateTool'
	import KitListTextMsg from '@/components/kit-chat/elements/kit-list-text-msg.vue'
	import KitListImgMsg from '@/components/kit-chat/elements/kit-list-img-msg.vue'
	import KitListVoiceMsg from '@/components/kit-chat/elements/kit-list-voice-msg.vue'
	import KitListFileMsg from '@/components/kit-chat/elements/kit-list-file-msg.vue'
	import KitListVideoMsg from '@/components/kit-chat/elements/kit-list-video-msg.vue'
	import { InnerMessage } from '@/models/ChatMessage'

	const props = defineProps<{ msg : InnerMessage }>()

	function resolveComponent() {
		const { type, content } = props.msg
		if (type === 'img' && content.url) return KitListImgMsg
		if (type === 'voice' && content.voiceUrl) return KitListVoiceMsg
		if (type === 'file' && content.fileUrl) return KitListFileMsg
		if (type === 'video' && content.videoUrl) return KitListVideoMsg
		return KitListTextMsg
	}

	const isMediaMsg = ['img', 'video'].includes(props.msg.type)

	const formatTime = (date : Date) => { return DateTool.formatTimeAgo(date) }

	const emit = defineEmits(['click'])
	const handleMessageClick = (type : string, content : any) => { emit('click', type, content) }
</script>

<style lang="scss" scoped>
	.chat-item {
		display: flex;
		width: 98%;
		margin-bottom: 30rpx;
		animation: fadeIn 0.3s ease-in-out;
	}

	.chat-item.my {
		flex-direction: row-reverse;
		justify-content: flex-start;
		padding-right: 30rpx;

		.avatar {
			margin-left: 12rpx;
		}

		.bubble {
			background-color: #007AFF;
			color: #fff;
			margin-right: 12rpx;

			&::after {
				right: -16rpx;
				left: auto;
				border-color: transparent transparent transparent #007AFF;
			}

			// 图片和视频消息移除气泡样式
			:deep(.image-message),
			:deep(.video-message) {
				.bubble {
					padding: 0;
					margin: 0;
					background: none;
					box-shadow: none;

					&::after {
						display: none;
					}
				}
			}
		}

		.bubble.is-media {
			padding: 0 !important;
			margin: 0 !important;
			background: none !important;
			box-shadow: none !important;
			border-radius: 0 !important;

			&::after {
				display: none !important;
			}
		}
	}

	.avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		margin-left: 20rpx; // ✅ 与气泡留出距离
		flex-shrink: 0;
	}

	.message-wrapper {
		max-width: 65%;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.bubble {
		background-color: #1890ff;
		color: #333;
		padding: 20rpx;
		border-radius: 20rpx;
		word-break: break-word;
		position: relative;

		&::after {
			content: '';
			position: absolute;
			top: 20rpx;
			right: -16rpx;
			width: 0;
			height: 0;
			border: 8rpx solid transparent;
			border-left-color: #1890ff;
		}
	}

	.time {
		font-size: 20rpx;
		color: #999;
		margin-top: 6rpx;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20rpx);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>