<template>
	<view class="voice-msg" @click="handleClick">
		<view class="voice-icon" :class="{ playing: isPlaying }">
			<view class="wave wave1"></view>
			<view class="wave wave2"></view>
			<view class="wave wave3"></view>
		</view>
		<text class="duration">{{ content.duration }}″</text>
	</view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
	content: {
		duration: number
		voiceUrl: string
	}
}>()

const emit = defineEmits(['click'])

const isPlaying = ref(false)

const handleClick = () => {
	emit('click', 'voice', props.content)

	if (isPlaying.value) {
		isPlaying.value = false // 停止播放
		// 可选：停止实际语音播放
		return
	}

	isPlaying.value = true
	// 假装播放，真实逻辑你可接 uni.createInnerAudioContext
	setTimeout(() => {
		isPlaying.value = false
	}, props.content.duration * 1000)
}
</script>

<style scoped lang="scss">
.voice-msg {
	display: flex;
	align-items: center;
	cursor: pointer;
}

.voice-icon {
	display: flex;
	align-items: center;
	margin-right: 12rpx;
	width: 24rpx;
	height: 32rpx;

	.wave {
		width: 4rpx;
		height: 100%;
		background-color: #333;
		margin-right: 2rpx;
		border-radius: 2rpx;
		opacity: 0.4;
		transform: scaleY(0.3);
		animation: none;
	}

	&.playing .wave1 {
		animation: waveAnim 0.6s ease-in-out infinite;
	}
	&.playing .wave2 {
		animation: waveAnim 0.6s ease-in-out 0.15s infinite;
	}
	&.playing .wave3 {
		animation: waveAnim 0.6s ease-in-out 0.3s infinite;
	}
}

.duration {
	font-size: 28rpx;
	color: #333;
}

@keyframes waveAnim {
	0%, 100% {
		transform: scaleY(0.3);
		opacity: 0.4;
	}
	50% {
		transform: scaleY(1);
		opacity: 1;
	}
}
</style>
