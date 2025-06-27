<template>
  <view class="markdown-message" @tap="handleClick">
    <view class="markdown-content" v-html="renderedHtml" @tap="handleContentTap"></view>
  </view>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, nextTick, computed } from 'vue';
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
const emit = defineEmits<{ (e: 'click', type: string, content: MessageContent): void }>();
const renderedHtml = ref('');

// 自定义渲染器处理 mermaid 代码块和带复制按钮的代码块
const renderer = new marked.Renderer();
const originalCodeRenderer = renderer.code.bind(renderer);

renderer.code = function({ text, lang }) {
  if (lang === 'mermaid') {
    return `<div class="mermaid">${text}</div>`;
  }
  // 代码块带语言和复制按钮
  const codeEscaped = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const langLabel = lang ? lang : '';
  return `
    <div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-lang">${langLabel}</span>
        <span class="copy-btn" data-code="${encodeURIComponent(text)}">复制代码</span>
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

const renderMarkdown = async () => {
  if (props.content.text) {
    const rawHtml = await marked.parse(props.content.text);
    console.debug('Raw HTML:', rawHtml); // 调试信息
    renderedHtml.value = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['data-code'] });
    console.debug('Processed HTML:', renderedHtml.value); // 调试信息
    nextTick(() => {
      try {
        mermaid.init(undefined, '.mermaid');
      } catch (e) {
        console.error('Mermaid render error:', e);
      }
    });
  } else {
    renderedHtml.value = '';
  }
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

// 处理内容的点击事件
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

// 添加样式确保 mermaid 图表正常显示
const addMermaidStyles = () => {
  if (typeof window !== 'undefined' && document) {
    if (!document.getElementById('mermaid-style')) {
      const style = document.createElement('style');
      style.id = 'mermaid-style';
      style.textContent = `
        .mermaid {
          background-color: white;
          margin: 16px 0;
          padding: 16px;
          border-radius: 8px;
          overflow: auto;
        }
      `;
      document.head.appendChild(style);
    }
  }
};

onMounted(() => {
  addMermaidStyles();
});

watch(() => props.content.text, renderMarkdown, { immediate: true });

const handleClick = () => {
  emit('click', 'markdown', props.content);
};
</script>

<style lang="scss" scoped>
@import '../markdown.scss';

.markdown-message {
  width: 100%;
  padding: 0;
  margin: 0;
}

:deep(.mermaid) {
  background-color: #f9f9f9;
  margin: 16rpx 0;
  padding: 16rpx;
  border-radius: 8rpx;
  overflow: auto;
}
</style>