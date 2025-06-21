<template>
	<view class="file-message" @click="handleClick">
		<view class="file-content">
			<view class="file-info">
				<text class="file-name">{{ content.fileName }} </text>
				<text class="file-size">{{ formatFileSize(content.fileSize) }}</text>
			</view>
		</view>
	</view>
</template>

<script lang="ts" setup>
	import { MessageContent } from '@/models/ChatMessage'

	const props = defineProps<{ content : MessageContent }>()

	const emit = defineEmits<{ (e : 'click', type : string, content : MessageContent) : void }>()

	const getFileIcon = (fileName : string) => {
		const ext = fileName.split('.').pop()?.toLowerCase()
		const iconMap : Record<string, string> = {
			'pdf': '/static/icons/pdf.png',
			'doc': '/static/icons/word.png',
			'docx': '/static/icons/word.png',
			'xls': '/static/icons/excel.png',
			'xlsx': '/static/icons/excel.png',
			'ppt': '/static/icons/ppt.png',
			'pptx': '/static/icons/ppt.png',
			'txt': '/static/icons/txt.png',
			'zip': '/static/icons/zip.png',
			'rar': '/static/icons/zip.png',
			'7z': '/static/icons/zip.png'
		}
		return iconMap[ext || ''] || '/static/icons/file.png'
	}

	const formatFileSize = (size : number) => {
		if (size < 1024) {
			return size + 'B'
		} else if (size < 1024 * 1024) {
			return (size / 1024).toFixed(1) + 'KB'
		} else if (size < 1024 * 1024 * 1024) {
			return (size / (1024 * 1024)).toFixed(1) + 'MB'
		} else {
			return (size / (1024 * 1024 * 1024)).toFixed(1) + 'GB'
		}
	}

	const handleClick = () => { emit('click', 'file', props.content) }
</script>

<style lang="scss" scoped>
	.file-message {
		.file-content {
			display: flex;
			align-items: center;
			padding: 16rpx;
			background: rgba(0, 0, 0, 0.05);
			border-radius: 12rpx;
			transition: background-color 0.2s ease;

			&:active {
				background: rgba(0, 0, 0, 0.08);
			}

			.file-icon {
				width: 48rpx;
				height: 48rpx;
				margin-right: 16rpx;
			}

			.file-info {
				flex: 1;
				overflow: hidden;

				.file-name {
					font-size: 28rpx;
					color: #333;
					margin-bottom: 4rpx;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.file-size {
					font-size: 24rpx;
					color: #999;
				}
			}
		}
	}
</style>