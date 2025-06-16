<template>
	<view class="chat-input-container">
		<!-- 第一行：功能按钮和设置 -->
		<view class="function-row">
			<view class="left-buttons">
				<image src="/static/icons/photo.png" mode="aspectFit" class="btn-icon" v-if="showImage"
					@tap="handleImage" />
				<image src="/static/icons/affix.png" mode="aspectFit" class="btn-icon" v-if="showAttachment"
					@tap="handleAttachment" />
				<image src="/static/icons/voice.png" mode="aspectFit" class="btn-icon" v-if="showVoice"
					@tap="handleVoice" />
				<image src="/static/icons/clear.png" mode="aspectFit" class="btn-icon" v-if="showVoice"
					@tap="handleclear" />
			</view>
			<view class="settings">
				<image src="/static/icons/set_gray.png" mode="aspectFit" class="btn-icon" @tap="toggleSettings" />
			</view>
		</view>

		<!-- 第二行：输入框和发送按钮 -->
		<view class="input-row">
			<textarea class="message-input" v-model="message" @focus="onFocus" @blur="onBlur" placeholder="输入消息..."
				:auto-height="true" :maxlength="-1" :cursor-spacing="20" :show-confirm-bar="false"
				:adjust-position="true" @confirm="sendMessage" />
			<!-- <view class="send-btn" :class="{ disabled: !message.trim() }" @tap="sendMessage"> -->
			<view class="send-btn" @tap="sendMessage">
				<image :src="sendButtonImage" :key="sendButtonImage" mode="aspectFit" class="send-icon" />
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import {
		ref,
		onBeforeUnmount,
		onMounted,
		computed,
		watch,
	} from 'vue'
	import { AppStorage } from '@/stores/AppStorage'
	import { CANSTOPCHAT } from '@/constances/constances'

	const emit = defineEmits(['image-upload', 'attachment-upload', 'voice-record', 'toggle-settings', 'send', 'stopChat', 'clear'])
	const message = ref('')
	const showImage = ref(true)
	const showAttachment = ref(true)
	const showVoice = ref(true)
	const isRecording = ref(false)
	const recordStartTime = ref(0)
	const recordTimer = ref<number | null>(null)
	interface Props {
		canStopChat : boolean;
	}
	const props = defineProps<Props>();
	const sendButtonImage = computed(() => {
		return props.canStopChat ? '/static/icons/stop.png' : '/static/icons/submit.png';
	});
	// const getImgUrl = () => {
	// 	// const img = AppStorage.get(CANSTOPCHAT) ? 'stop' : "submit";
	// 	// import(`./static/icons/${img}.png`).then(m => InteractiveObject.value = m)
	// 	return AppStorage.get(CANSTOPCHAT) ? '/static/icons/stop.png' : "/static/icons/submit.png";
	// }
	// 图片处理
	const handleImage = () => {
		uni.chooseImage({
			count: 9,
			success: (res) => {
				const tempFiles = res.tempFilePaths
				emit('image-upload', tempFiles)
			}
		})
	}

	// 附件处理
	const handleAttachment = () => {
		uni.chooseFile({
			count: 1,
			success: (res) => {
				const tempFiles = res.tempFiles
				emit('attachment-upload', tempFiles)
			}
		})
	}

	// 语音处理
	const handleVoice = () => {
		if (isRecording.value) {
			stopRecording()
		} else {
			startRecording()
		}
	}

	//清除会话
	const handleclear = () => {
		//todo清除会话
		emit('clear')
	}

	const startRecording = () => {
		isRecording.value = true
		recordStartTime.value = Date.now()

		// 开始录音
		uni.startRecord({
			success: (res) => {
				const duration = Math.floor((Date.now() - recordStartTime.value) / 1000)
				emit('voice-record', {
					filePath: res.tempFilePath,
					duration
				})
			},
			fail: (err) => {
				uni.showToast({
					title: '录音失败',
					icon: 'none'
				})
			}
		})

		// 显示录音动画
		recordTimer.value = setInterval(() => {
			const duration = Math.floor((Date.now() - recordStartTime.value) / 1000)
			if (duration >= 60) { // 最长录音60秒
				stopRecording()
			}
		}, 1000)
	}

	const stopRecording = () => {
		if (recordTimer.value) {
			clearInterval(recordTimer.value)
			recordTimer.value = null
		}
		isRecording.value = false
		uni.stopRecord()
	}

	// 设置处理
	const toggleSettings = () => {
		emit('toggle-settings')
	}

	// 发送消息
	const sendMessage = () => {
		if (props.canStopChat) {
			emit('stopChat');
		} else {
			const msg = message.value.trim();
			if (msg) {
				emit('send', msg);
				message.value = '';
			}
		}
	};
	// const sendMessage = () => {
	// 	const msg = message.value.trim()
	// 	if (!msg) {
	// 		//停止回答输出处理
	// 		emit('stopChat')
	// 	} else {
	// 		// 添加发送动画
	// 		const sendBtn = document.querySelector('.send-btn')
	// 		if (sendBtn) {
	// 			sendBtn.classList.add('sending')
	// 			setTimeout(() => {
	// 				sendBtn.classList.remove('sending')
	// 			}, 500)
	// 		}

	// 		emit('send', msg)
	// 		message.value = ''
	// 		// getImgUrl()
	// 	}
	// }

	// 输入框焦点处理
	const onFocus = () => {
		// 滚动到底部
		setTimeout(() => {
			uni.pageScrollTo({
				scrollTop: 99999,
				duration: 300
			})
		}, 100)
	}

	const onBlur = () => {
		// 可以在这里处理输入框失焦后的逻辑
	}

	// 组件销毁前清理
	onBeforeUnmount(() => {
		if (recordTimer.value) {
			clearInterval(recordTimer.value)
		}
		if (isRecording.value) {
			uni.stopRecord()
		}
	})
</script>

<style lang="scss" scoped>
	@import "@/uni.scss";

	.chat-input-container {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 999;
		padding-top: 20rpx;
		// margin-bottom: 20rpx;
		/* 添加安全区域适配 */
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);
		background: $uni-bg-color;
	}

	.function-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 50rpx 20rpx;
	}

	.left-buttons {
		display: flex;
		gap: $uni-spacing-row-lg;
	}

	.btn-icon {
		width: 30rpx;
		height: 30rpx;
	}

	.input-row {
		display: flex;
		align-items: end;
		justify-content: space-between;
		padding: 0 30rpx 10rpx;
	}

	.message-input {
		width: 88%;
		min-height: 35rpx;
		max-height: 25vh;
		padding: 8px 12px;
		font-size: 14px;
		border: 1px solid #e5e5e5;
		border-radius: 18px;
		background-color: #fff;
		box-sizing: border-box;
		resize: none;
		overflow-y: auto;
	}

	.message-input:focus {
		outline: none;
		border-color: #007AFF;
	}

	.send-btn {
		width: 70rpx;
		height: 70rpx;
		border-radius: 50%;
		background-color: #8cc5ff;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}

	.send-btn.disabled {
		background-color: #ccc;
		cursor: not-allowed;
		opacity: 0.5;

	}

	.send-icon {
		width: 30rpx;
		height: 30rpx;
	}
</style>