<template>
	<view class="chat-item other">
		<image class="avatar" :src="msg.userinfo.face" />
		<view class="message-wrapper">
			<view class="bubble" :class="{ 'is-media': isMediaMsg }">
				<component :is="resolveComponent()" :content="msg.content" @click="handleMessageClick" />
			</view>
			<view class="message-initeract">
				<view class="feedback-btn" hover-class="feedback-btn-hover" @click="handleFavourClick">
					<image :src="favourActive ? '/static/icons/favour_clinck.png' : '/static/icons/favour.png'" mode="aspectFit" />
				</view>
				<view class="feedback-btn rotated-image" hover-class="feedback-btn-hover" @click="handleFeedbackClick">
					<image :src="dislikeActive ? '/static/icons/favour_clinck.png' : '/static/icons/favour.png'" mode="aspectFit" />
				</view>
				<view class="feedback-btn" hover-class="feedback-btn-hover" @click="handleCopyClick">
					<image src="/static/icons/copy.png" mode="aspectFit" />
				</view>
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
	import { ref, inject, computed } from 'vue'

	const props = defineProps<{ msg : InnerMessage }>()
	const emit = defineEmits(['click', 'feedback'])
	const feedbackMap = inject('feedbackMap')

	const favourActive = computed(() => {
		const state = feedbackMap?.get(props.msg.id)
		return state?.like === true
	})
	const dislikeActive = computed(() => {
		const state = feedbackMap?.get(props.msg.id)
		return state?.dislike === true
	})

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

	const handleMessageClick = (type : string, content : any) => {
		emit('click', type, content)
	}

	function handleFavourClick() {
		if (dislikeActive.value) {
			feedbackMap.set(props.msg.id, { like: true, dislike: false })
		} else if (favourActive.value) {
			feedbackMap.set(props.msg.id, { ...feedbackMap.get(props.msg.id), like: false })
		} else {
			feedbackMap.set(props.msg.id, { ...feedbackMap.get(props.msg.id), like: true, dislike: false })
		}
	}
	function handleFeedbackClick() {
		emit('feedback', props.msg)
	}
	
	function handleCopyClick() {
		let text = ''
		if ((props.msg.type === 'text' || props.msg.type === 'markdown') && props.msg.content.text) {
			text = props.msg.content.text
		} else if (props.msg.type === 'img' && props.msg.content.url) {
			text = props.msg.content.url
		} else {
			text = JSON.stringify(props.msg.content)
		}
		uni.setClipboardData({
			data: text,
			success: () => {
				uni.showToast({
					title: '复制成功',
					icon: 'none',
					duration: 1500
				})
			}
		})
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

	.message-initeract {
		display: flex;
		flex-direction: row;
		gap: 18rpx;
		margin-top: 10rpx;
	}

	.feedback-btn {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: box-shadow 0.2s;
		border: 1rpx solid #ececec;
		cursor: pointer;
	}

	.feedback-btn-hover {
		box-shadow: 0 4rpx 16rpx rgba(11,138,255,0.12);
		border-color: #0b8aff;
	}

	.feedback-btn image {
		width: 32rpx;
		height: 32rpx;
	}

	.rotated-image {
		transform: rotateZ(180deg);
	}

	.feedback-popup-content {
		height: 33vh;
		background: #fff;
		border-top-left-radius: 24rpx;
		border-top-right-radius: 24rpx;
		box-shadow: 0 -2rpx 16rpx rgba(0,0,0,0.08);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
	}
</style>