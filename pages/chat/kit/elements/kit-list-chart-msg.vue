<template>
  <view class="chart-message" @click="handleClick">
    <div ref="chartRef" class="chart-content"></div>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { MessageContent } from '@/models/ChatMessage'

const props = defineProps<{
  content: MessageContent
}>()

const emit = defineEmits<{
  (e: 'click', type: string, content: MessageContent): void
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const renderChart = () => {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  let option = props.content.option
    ? props.content.option
    : {
        title: props.content.title || {},
        tooltip: props.content.tooltip || {},
        xAxis: props.content.xAxis || {},
        yAxis: props.content.yAxis || {},
        series: props.content.series || []
      }
  option = {
    grid: { left: 40, right: 20, top: 40, bottom: 40, containLabel: true },
    ...option,
    title: { left: 'center', ...option.title },
    tooltip: { trigger: 'axis', ...option.tooltip },
  }
  chartInstance.setOption(option, true)
}

onMounted(() => {
  renderChart()
})

watch(() => props.content, () => {
  renderChart()
}, { deep: true })

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

const handleClick = () => {
  emit('click', 'chart', props.content)
}
</script>

<style lang="scss" scoped>
.chart-message {
  display: flex;
  justify-content: center;
  .chart-content {
    width: 90vw;
    max-width: 600rpx;
    min-width: 240rpx;
    height: 260px;
    min-height: 200px;
    max-height: 360px;
    background: #fff;
    border-radius: 12rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
    margin: 0 auto;
    padding: 0;
    overflow: hidden;
    transition: width 0.2s;
  }
}
</style> 