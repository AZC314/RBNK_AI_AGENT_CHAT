<template>
  <div class="markdown-message">
    <div class="markdown-content" v-html="renderedHtml" @click="handleContentClick"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';
import type { MessageContent } from '@/models/ChatMessage';

// 声明uni全局对象类型
declare const uni: any;

// 初始化 mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  flowchart: { useMaxWidth: true }
});

const props = defineProps<{ content: MessageContent }>();
const renderedHtml = ref('');

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
marked.setOptions({ renderer, breaks: true, gfm: true });

const wrapTable = (html: string) => {
  return html.replace(/<table([\s\S]*?)<\/table>/g, match => `<div class="table-scroll-x">${match}</div>`);
};

const renderMarkdown = async () => {
  if (props.content.text) {
    const rawHtml = await marked.parse(props.content.text);
    renderedHtml.value = wrapTable(DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['data-code'] }));
    nextTick(() => {
      try { mermaid.init(undefined, '.mermaid'); } catch (e) {}
    });
  } else {
    renderedHtml.value = '';
  }
};

watch(() => props.content.text, renderMarkdown, { immediate: true });

const handleContentClick = (e: any) => {
  const target = e.target;
  if (target.classList && target.classList.contains('copy-btn') && target.dataset.code) {
    const code = decodeURIComponent(target.dataset.code);
    uni.setClipboardData({
      data: code,
      success: () => { uni.showToast({ title: '复制成功', icon: 'none' }); },
      fail: () => { uni.showToast({ title: '复制失败', icon: 'none' }); }
    });
  }
};
</script>

<style lang="scss" scoped>
@import '../markdown.scss';

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