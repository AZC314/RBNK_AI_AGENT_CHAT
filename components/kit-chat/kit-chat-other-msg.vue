<template>
	<view class="chat-item other">
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
	import KitListMarkdownMsg from '@/components/kit-chat/elements/kit-list-markdown-msg.vue'
	import KitListChartMsg from '@/components/kit-chat/elements/kit-list-chart-msg.vue'
	import { InnerMessage } from '@/models/ChatMessage'

	const props = defineProps<{ msg : InnerMessage }>()

	function resolveComponent() {
		const { type, content } = props.msg
		if (type === 'img' && content.url) return KitListImgMsg
		if (type === 'voice' && content.voiceUrl) return KitListVoiceMsg
		if (type === 'file' && content.fileUrl) return KitListFileMsg
		if (type === 'video' && content.videoUrl) return KitListVideoMsg
		if (type === 'markdown' && content.text) return KitListMarkdownMsg
		if (type === 'chart' && (content.series || content.option)) return KitListChartMsg
		return KitListTextMsg
	}

	const isMediaMsg = ['img', 'video', 'markdown'].includes(props.msg.type)

	const formatTime = (date : Date) => { return DateTool.formatTimeAgo(date) }

	const emit = defineEmits(['click'])
	const handleMessageClick = (type : string, content : any) => {
		emit('click', type, content)
	}
</script>

<style lang="scss" scoped>
	@import './chat-common.scss';

	.chat-item {
		display: flex;
		width: 99%;
		margin-bottom: 30rpx;
		animation: fadeIn 0.3s ease-in-out;
	}

	.chat-item.other {
		flex-direction: row;
		justify-content: flex-start;
		padding-left: 15rpx;

		.avatar {
			margin-right: 10rpx;
		}

		.bubble {
			background-color: #f5f5f5;
			color: #333;
			margin-left: 12rpx;
			overflow: clip;

			&::after {
				left: -16rpx;
				border-color: transparent #f5f5f5 transparent transparent;
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
</style>