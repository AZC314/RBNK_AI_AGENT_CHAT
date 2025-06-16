<template>
  <view class="markdown-message" @click="handleClick">
    <view class="markdown-content" v-html="renderedHtml"></view>
  </view>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import { MessageContent } from '@/models/ChatMessage.ts'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps<{
  content: MessageContent
}>()

const emit = defineEmits<{
  (e: 'click', type: string, content: MessageContent): void
}>()

const renderedHtml = ref('')

const renderMarkdown = () => {
  if (props.content.text) {
    renderedHtml.value = DOMPurify.sanitize(marked.parse(props.content.text))
  } else {
    renderedHtml.value = ''
  }
}

watch(() => props.content.text, renderMarkdown, { immediate: true })

const handleClick = () => {
  emit('click', 'markdown', props.content)
}
</script>

<style lang="scss" scoped>
.markdown-message {
  .markdown-content {
    font-size: 28rpx;
    line-height: 1.4;
    word-break: break-all;
    white-space: pre-wrap;
    color: #222;
    background: none;
    padding: 0;
  }
}
</style> 