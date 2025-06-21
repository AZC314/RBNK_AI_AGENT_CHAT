<template>
	<view class="chat-item my">
		<view class="avatar-container">
			<image class="avatar" :src="avatar" mode="aspectFill" />
			<!-- <view v-else class="avatar-placeholder">{{ getFirstChar(msg.userinfo.username) }}</view> -->
		</view>
		<view class="message-wrapper">
			<view class="bubble" :class="{ 'is-media': isMediaMsg }">
				<component :is="resolveComponent()" :content="msg.content" @click="handleMessageClick" />
			</view>
			<text class="time">{{ formatTime(msg.time) }}</text>
		</view>
	</view>
</template>

<script lang="ts" setup>
	import { Ref, ref, onMounted } from 'vue'
	import { DateTool } from '@/tools/dateTool'
	import KitListTextMsg from '@/pages/chat/kit/elements/kit-list-text-msg.vue'
	import KitListImgMsg from '@/pages/chat/kit/elements/kit-list-img-msg.vue'
	import KitListVoiceMsg from '@/pages/chat/kit/elements/kit-list-voice-msg.vue'
	import KitListFileMsg from '@/pages/chat/kit/elements/kit-list-file-msg.vue'
	import KitListVideoMsg from '@/pages/chat/kit/elements/kit-list-video-msg.vue'
	import { InnerMessage } from '@/models/ChatMessage'
	import { GET_PHOTO } from '@/api/api'
	import { useAvatarStore } from '@/stores/useAvatarStore'
	import GeneralServices from '@/api/GeneralServices'

	const avatarStore = useAvatarStore()
	const props = defineProps<{ msg : InnerMessage }>()
	const avatar : Ref<string> = ref('')
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

	function getFirstChar(name : string) {
		return name ? name.charAt(0).toUpperCase() : ''
	}

	onMounted(async() => {
		avatar.value = await GeneralServices.loadAvatar('USER', props!.msg!.userinfo!.face!)
	})
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

	.avatar-container {
		width: 80rpx;
		height: 80rpx;
		margin-left: 20rpx;
		margin-right: 0;
		position: relative;
		flex-shrink: 0;
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