<template>
	<view class="stream-msg">
		<view class="markdown-content" v-html="renderedHtml" @tap="handleContentTap"></view>
		<text v-if="loading" class="cursor">|</text>
	</view>
</template>

<script setup lang="ts">
	import { ref, watch, onBeforeUnmount, nextTick, computed } from 'vue';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	// 声明uni全局对象类型
	declare const uni: any;

	const props = defineProps<{
		start : boolean;              // 是否启动流式输出
		requestFn : (onChar : (char : string) => void, onDone : () => void) => Promise<void>;
	}>();

	const displayText = ref('');
	const renderedHtml = ref('');
	const loading = ref(false);
	let stop = false;

	// 自定义渲染器，代码块带语言和复制按钮，且不显示第一个\n
	const renderer = new marked.Renderer();
	const originalCodeRenderer = renderer.code.bind(renderer);
	renderer.code = function({ text, lang }) {
		// 处理标题和内容分离
		let codeTitle = '';
		let codeBody = text;
		const firstNewline = text.indexOf('\n');
		if (firstNewline !== -1) {
			codeTitle = text.slice(0, firstNewline).trim();
			codeBody = text.slice(firstNewline + 1);
		}
		const codeEscaped = codeBody.replace(/</g, '&lt;').replace(/>/g, '&gt;');
		const langLabel = lang ? lang : '';
		return `
			<div class="code-block-wrapper">
				<div class="code-block-header">
					<span class="code-lang">${codeTitle || langLabel}</span>
					<span class="copy-btn" data-code="${encodeURIComponent(codeBody)}">复制代码</span>
				</div>
				<div class="code-block-content"><code class="language-${langLabel}">${codeEscaped}</code></div>
			</div>
		`;
	};
	marked.setOptions({
		renderer,
		breaks: true,
		gfm: true
	});

	const reset = () => {
		displayText.value = '';
		renderedHtml.value = '';
		loading.value = false;
		stop = false;
	};

	const renderMarkdown = async () => {
		const rawHtml = await marked.parse(displayText.value);
		renderedHtml.value = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['data-code'] });
	};

	// 复制代码功能
	const copyCode = (code: string) => {
		uni.setClipboardData({
			data: code,
			success: () => {
				uni.showToast({
					title: '已复制',
					icon: 'success',
					duration: 1200
				});
			},
			fail: () => {
				uni.showToast({
					title: '复制失败',
					icon: 'none'
				});
			}
		});
	};

	// 处理rich-text的点击事件
	const handleContentTap = (e: any) => {
		// 阻止事件冒泡
		e.stopPropagation();
		
		// 检查是否点击了复制按钮
		if (e.target && e.target.dataset && e.target.dataset.code) {
			const code = decodeURIComponent(e.target.dataset.code);
			copyCode(code);
			return;
		}
	};

	const runStream = async () => {
		reset();
		loading.value = true;
		await props.requestFn?.(
			(char : string) => {
				if (stop) return;
				displayText.value += char;
				renderMarkdown();
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

<style lang="scss" scoped>
@import './markdown.scss';

.stream-msg {
	width: 100%;
	font-size: 28rpx;
	color: #333;
	line-height: 1.7;
	word-break: break-word;
	white-space: normal;
}

.stream-text {
	font-size: inherit;
}

.cursor {
	color: #007aff;
	animation: blink 1s step-start 0s infinite;
}

@keyframes blink {
	50% { opacity: 0; }
}
</style>