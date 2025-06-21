<template>
	<view class="image-message" @click="handleClick">
		<image class="image-content" :src="content.url" mode="widthFix" :style="{ width: imageWidth + 'rpx' }" />
	</view>
</template>

<script lang="ts" setup>
	import { MessageContent } from '@/models/ChatMessage.ts'
	import { ref, onMounted } from 'vue'

	const props = defineProps<{
		content: MessageContent
	}>()

	const emit = defineEmits<{
		(e: 'click', type: string, content: MessageContent): void
	}>()

	const imageWidth = ref(400)

	onMounted(() => {
		// 获取图片实际尺寸并计算显示宽度
		uni.getImageInfo({
			src: props.content.url,
			success: (res) => {
				const maxWidth = 400
				const maxHeight = 300
				const ratio = res.width / res.height
				
				if (res.width > maxWidth) {
					imageWidth.value = maxWidth
				} else if (res.height > maxHeight) {
					imageWidth.value = maxHeight * ratio
				} else {
					imageWidth.value = res.width
				}
			}
		})
	})

	const handleClick = () => {
		emit('click', 'img', props.content)
	}
</script>

<style lang="scss" scoped>
	.image-message {
		.image-content {
			border-radius: 16rpx;
			overflow: hidden;
			box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
			transition: transform 0.2s ease;
			
			&:active {
				transform: scale(0.98);
			}
		}
	}
</style>