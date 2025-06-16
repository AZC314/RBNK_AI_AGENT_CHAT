<template>
	<view class="text-message" @click="handleClick">
		<text class="text-content">{{ content.text }}</text>
	</view>
</template>

<script lang="ts" setup>
	import { MessageContent } from '@/models/ChatMessage.ts'

	const props = defineProps<{ content : MessageContent }>()

	const emit = defineEmits<{ (e : 'click', type : string, content : MessageContent) : void }>()

	const handleClick = () => { emit('click', 'text', props.content) }
</script>

<style lang="scss" scoped>
	.text-message {
		.text-content {
			font-size: 28rpx;
			line-height: 1.5;
			word-break: break-all;
			white-space: pre-wrap;
		}
	}
</style>