<template>
	<div class="stream-msg">
		<div class="markdown-content" v-html="renderedHtml" @click="handleContentClick"></div>
		<span v-if="loading" class="cursor">|</span>
	</div>
</template>

<script setup lang="ts">
	import { ref, watch, onBeforeUnmount, nextTick } from 'vue';
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
	renderer.code = function({ text, lang }) {
		const codeEscaped = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return `
			<div class="code-block-wrapper">
				<div class="code-block-header">
					<span class="code-lang">${lang || ''}</span>
					<span class="copy-btn" data-code="${encodeURIComponent(text)}">复制代码</span>
				</div>
				<div class="code-block-content">
					<code class="language-${lang}">${codeEscaped}</code>
				</div>
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

	const wrapTable = (html: string) => {
		return html.replace(/<table([\s\S]*?)<\/table>/g, match => `<div class=\"table-scroll-x\">${match}</div>`);
	};

	const renderMarkdown = async () => {
		const rawHtml = await marked.parse(displayText.value);
		renderedHtml.value = wrapTable(DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['data-code'] }));
	};

	// 复制代码功能
	const copyToClipboard = (text: string) => {
		uni.setClipboardData({
			data: text,
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
	const handleContentClick = (e: any) => {
		const target = e.target;
		if (target.classList && target.classList.contains('copy-btn') && target.dataset.code) {
			const code = decodeURIComponent(target.dataset.code);
			copyToClipboard(code);
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

.code-block-wrapper {
	margin: 16rpx 0;
	border: 1rpx solid #eee;
	border-radius: 8rpx;
	overflow: hidden;
}
.code-block-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8rpx 16rpx;
	background: #f5f5f5;
}
.code-lang {
	color: #888;
	font-size: 22rpx;
}
.copy-btn {
	color: #007aff;
	font-size: 24rpx;
	cursor: pointer;
	user-select: none;
	padding: 2rpx 10rpx;
	border-radius: 4rpx;
	transition: background 0.2s;
}
.copy-btn:hover {
	background: #e6f0fa;
}
.code-block-content {
	padding: 16rpx;
	background: #f6f8fa;
	overflow-x: auto;
	overflow-y: hidden;
	white-space: nowrap;
	position: relative;
	-webkit-overflow-scrolling: touch;
	scrollbar-width: thin;
	scrollbar-color: #c1c1c1 #f6f8fa;
}
.code-block-content::-webkit-scrollbar {
	height: 6rpx;
}
.code-block-content::-webkit-scrollbar-track {
	background: #f6f8fa;
	border-radius: 3rpx;
}
.code-block-content::-webkit-scrollbar-thumb {
	background: #c1c1c1;
	border-radius: 3rpx;
}
.code-block-content::-webkit-scrollbar-thumb:hover {
	background: #a8a8a8;
}
.code-block-content code {
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
	font-size: 26rpx;
	line-height: 1.5;
	color: #24292e;
	white-space: pre;
	word-break: normal;
	background: transparent;
	padding: 0;
	border-radius: 0;
	display: block;
	min-width: 100%;
}
</style>