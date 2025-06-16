<template>
	<view class="stream-msg">
		<text class="stream-text">{{ displayText }}</text>
		<text v-if="loading" class="cursor">|</text>
	</view>
</template>

<script setup lang="ts">
	import { ref, watch, onBeforeUnmount } from 'vue';

	const props = defineProps<{
		start : boolean;              // 是否启动流式输出
		requestFn : (onChar : (char : string) => void, onDone : () => void) => Promise<void>;// 触发请求的方法（例如 POST_CHAT_COMPLETIONS）
	}>();

	const displayText = ref('');
	const loading = ref(false);
	let stop = false;

	const reset = () => {
		displayText.value = '';
		loading.value = false;
		stop = false;
	};

	const runStream = async () => {
		reset();
		loading.value = true;

		await props.requestFn?.(
			(char : string) => {
				if (stop) return;
				displayText.value += char;
			},
			() => {
				loading.value = false;
			}
		);
	};

	watch(() => props.start, (newVal) => {
		if (newVal) runStream();
	});

	onBeforeUnmount(() => {
		stop = true;
	});
</script>

<style scoped>
	.stream-msg {
		display: flex;
		flex-wrap: wrap;
		word-break: break-word;
		font-size: 16px;
		line-height: 1.5;
	}

	.stream-text {
		white-space: pre-wrap;
	}

	.cursor {
		animation: blink 1s step-start 0s infinite;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>