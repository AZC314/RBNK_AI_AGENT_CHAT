<template>
	<view class="search-container">
		<!-- 左侧图标 -->
		<image src="/static/icons/searching.png" class="search-icon" />

		<!-- 输入框 -->
		<input class="search-input" :placeholder="placeholder" placeholder-class="placeholder-style" :value="modelValue"
			@input="onInput" :id="inputID"/>

		<!-- 清除按钮（只有在有内容时才显示） -->
		<image src="/static/icons/close_circle_fill.png" class="clear-icon" v-if="modelValue" @click="clearInput" />
	</view>
</template>

<script setup lang="ts">
	import {
		defineProps,
		defineEmits
	} from 'vue'

	interface Props {
		modelValue?: string
		placeholder?: string
		inputID?: string
	}
	
	const props = withDefaults(defineProps<Props>(), {
		modelValue: '',
		placeholder: '搜索',
		inputID: 'SearchBox'
	})

	const emit = defineEmits(['update:modelValue'])

	function onInput(e) {
		emit('update:modelValue', e.detail.value)
	}

	function clearInput() {
		emit('update:modelValue', '')
	}
</script>

<style scoped>
	image {
		width: 24px;
		height: 24px;
	}

	.search-container {
		width: calc(100vw - 30rpx);
		margin: 10rpx 15rpx;
		padding: 0 20rpx;
		gap: 20rpx;
		display: flex;
		flex-direction: row;
		box-sizing: border-box;
		background-color: #f5f5f5;
		border-radius: 30rpx;
		align-items: center;
		justify-content: start;
	}

	.search-input {
		flex-grow: 1;
		height: 60rpx;
		font-size: 28rpx;
		padding: 0 20rpx;
		box-sizing: border-box;
		background-color: transparent;
	}

	.placeholder-style {
		color: #999;
		font-size: 28rpx;
	}
	
</style>