<template>
	<scroll-view class="chat-message-list" scroll-y="true" :scroll-top="scrollTop" @scrolltoupper="loadMoreMessages"
		@scroll="onScroll" upper-threshold= "65">
		<view class="message-container">
			<uni-load-more v-if="isRefreshing" :status="loadMoreStatus" :content-text="loadMoreContentText"/>
			<template v-for="msg in msgList" :key="msg.msg.id" ><!-- v-if="msgList && msgList.length > 0" -->
				<!-- 系统消息 -->
				<kit-chat-system-msg v-if="msg.type === 'system'" :msg="msg.msg" />
				<!-- 我发送的消息 -->
				<kit-chat-my-msg v-else-if="msg.type === 'user' && msg.isSelf(myInfo.id ?? '000')" :msg="msg.msg"
					@favour_clinck="handleMessageClick" />
				<!-- 对方发送的消息 -->
				<kit-chat-other-msg v-else :msg="msg.msg" @click="handleMessageClick" @feedback="handleFeedback" @like="handleLike" @dislike="handleDislike" @undislike="handleUndislike" @unlike="handleUnlike" />
			</template>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import {
		computed,
		onMounted,
		ref,
		watch,
		onUnmounted,
		nextTick
	} from 'vue'
	import kitChatSystemMsg from '@/pages/chat/kit/kit-chat-system-msg.vue'
	import kitChatMyMsg from '@/pages/chat/kit/kit-chat-my-msg.vue'
	import kitChatOtherMsg from '@/pages/chat/kit/kit-chat-other-msg.vue'
	import ChatMessage, {
		InnerMessage,
		MessageContent,
		UserInfo
	} from '@/models/ChatMessage.ts'
	import { AppStorage } from '@/stores/AppStorage'
	import { Info } from '@/models/INFO'

	// 组件props定义
	const props = defineProps<{
		msgList : ChatMessage[], // 消息列表
		loadMoreStatus: string, // uni-load-more状态
		isRefreshing: boolean, // 是否顶部加载中
		loadMoreContentText: any, // uni-load-more文案
		scrollTo?: string // 'top' | 'bottom'，控制滚动定位
	}>()

	// 组件事件定义
	const emit = defineEmits(['load-more', 'refresh', 'feedback', 'like', 'dislike', 'undislike', 'unlike'])

	// scrollTop为scroll-view定位值，仅内部响应式变量
	const scrollTop = ref(0)
	// 记录上次滚动位置，仅本地用
	const oldScrollTop = ref(0) // 未被外部用到

	// 当前用户信息
	const myInfo = AppStorage.get('userInfo') as Info.User;

	// 监听消息列表变化，自动滚动到底部
	watch(() => props.msgList, (newVal) => {
		if (newVal.length > 0) {
			setTimeout(() => {
				const query = uni.createSelectorQuery()
				query.select('.message-container').boundingClientRect()
				query.exec((res) => {
					if (res[0]) {
						scrollTop.value = res[0].height
					}
				})
			}, 100)
		}
	}, { deep: true })

	// 监听scrollTo变化，控制scroll-view定位
	watch(() => props.scrollTo, async (val) => {
		await nextTick()
		if (val === 'top') {
			scrollTop.value = 0
		} else if (val === 'bottom') {
			scrollTop.value = 999999
		}
	})

	/**
	 * 触发顶部加载更多
	 */
	const loadMoreMessages = () => {
		emit('load-more')
	}

	// 下拉刷新处理
	const onRefresh = async () => {
		try {
			emit('refresh')
			// 刷新完成后，将消息列表定位到顶部
			scrollTop.value = 0
		} catch (error) {
			console.error('刷新失败:', error)
		}
	}

	/**
	 * 监听滚动事件，记录滚动位置
	 */
	const onScroll = (e : any) => {
		oldScrollTop.value = e.detail.scrollTop
	}

	// 语音播放互斥相关变量
	let audioContext : any = null
	let playingVoice = ''
	// 组件卸载时停止语音播放
	onUnmounted(() => {
		if (audioContext) {
			audioContext.stop()
			audioContext = null
		}
	})

	/**
	 * 统一处理消息点击（图片、语音、文件、视频等）
	 */
	const handleMessageClick = (type : string, content : any) => {
		switch (type) {
			case 'img':
				uni.previewImage({ urls: [content.url], current: content.url })
				break
			case 'voice':
				if (audioContext && playingVoice === content.voiceUrl) {
					audioContext.stop()
					playingVoice = ''
				} else {
					if (audioContext) audioContext.stop()
					audioContext = uni.createInnerAudioContext()
					audioContext.src = content.voiceUrl
					audioContext.play()
					playingVoice = content.voiceUrl
					audioContext.onEnded(() => { playingVoice = '' })
				}
				break
			case 'file':
				uni.downloadFile({
					url: content.fileUrl,
					success: (res) => {
						if (res.statusCode === 200) {
							uni.openDocument({ filePath: res.tempFilePath })
						}
					}
				})
				break
			case 'video':
				uni.navigateTo({
					url: `/pages/video-player/video-player?url=${encodeURIComponent(content.videoUrl)}`
				})
				break
			default:
				console.log('消息点击', type, content)
		}
	}

	/**
	 * 消息反馈相关事件
	 */
	function handleFeedback(msg) {
		emit('feedback', msg)
	}
	function handleLike(msg) {
		emit('like', msg)
	}
	function handleDislike(msg) {
		emit('dislike', msg)
	}
	function handleUndislike(msg) {
		emit('undislike', msg)
	}
	function handleUnlike(msg) {
		emit('unlike', msg)
	}
</script>

<style lang="scss" scoped>
	.chat-message-list {
		height: 100%;
		background-color: #f5f5f5;

		.message-container {
			padding: 10rpx 0 5rpx;
			min-height: 100%;
			background-color: #f5f5f5;
		}

		// 消息动画
		:deep(.message-item) {
			animation: fadeIn 0.3s ease-in-out;
		}

		// 系统消息样式
		:deep(.system-message) {
			text-align: center;
			color: #999;
			font-size: 24rpx;
			margin: 20rpx 0;
			padding: 10rpx 20rpx;
			background-color: rgba(0, 0, 0, 0.05);
			border-radius: 30rpx;
			display: inline-block;
		}

		// 用户消息样式
		:deep(.user-message) {
			margin-bottom: 30rpx;
			display: flex;
			align-items: flex-start;

			&.self {
				flex-direction: row-reverse;

				.message-content {
					margin-right: 20rpx;
					margin-left: 100rpx;
					background-color: #007AFF;
					color: #fff;
					border-radius: 20rpx 4rpx 20rpx 20rpx;

					&::after {
						right: -16rpx;
						left: auto;
						border-color: transparent transparent transparent #007AFF;
					}
				}
			}

			&.other {
				.message-content {
					margin-left: 20rpx;
					margin-right: 100rpx;
					background-color: #fff;
					color: #333;
					border-radius: 4rpx 20rpx 20rpx 20rpx;

					&::after {
						left: -16rpx;
						border-color: transparent #fff transparent transparent;
					}
				}
			}

			.avatar {
				width: 80rpx;
				height: 80rpx;
				border-radius: 50%;
				overflow: hidden;
				box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);

				image {
					width: 100%;
					height: 100%;
				}
			}

			.message-content {
				position: relative;
				padding: 20rpx;
				max-width: 60%;
				box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);

				&::after {
					content: '';
					position: absolute;
					top: 20rpx;
					width: 0;
					height: 0;
					border: 8rpx solid transparent;
				}

				.text {
					font-size: 28rpx;
					line-height: 1.4;
					word-break: break-all;
				}

				.image {
					max-width: 400rpx;
					border-radius: 16rpx;
					overflow: hidden;

					image {
						width: 100%;
						height: auto;
					}
				}

				.voice {
					display: flex;
					align-items: center;
					min-width: 120rpx;

					.icon {
						width: 32rpx;
						height: 32rpx;
						margin-right: 8rpx;
					}

					.duration {
						font-size: 24rpx;
					}
				}

				.file {
					display: flex;
					align-items: center;
					padding: 16rpx;
					background: rgba(0, 0, 0, 0.05);
					border-radius: 8rpx;

					.icon {
						width: 48rpx;
						height: 48rpx;
						margin-right: 16rpx;
					}

					.info {
						flex: 1;

						.name {
							font-size: 28rpx;
							margin-bottom: 8rpx;
						}

						.size {
							font-size: 24rpx;
							color: #999;
						}
					}
				}

				.video {
					position: relative;
					width: 400rpx;
					height: 300rpx;
					border-radius: 16rpx;
					overflow: hidden;

					.cover {
						width: 100%;
						height: 100%;
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
				}
			}
		}
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