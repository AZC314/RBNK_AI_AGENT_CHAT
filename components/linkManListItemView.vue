<template>
	<uni-list-item class="linkman-item" @click="onItemClick" clickable>
		<template v-slot:header>
			<!-- 头像区域 -->
			<view class="avatar-container">
				<image v-if="linkman.avatarUrl" :src="GET_PHOTO(linkman.avatarUrl)" class="avatar" mode="aspectFill" />
				<view v-else class="avatar-placeholder">
					{{ getFirstChar(linkman.name) }}
				</view>
				<!-- 在线状态指示器 -->
				<!-- <view v-if="linkman.isOnline" class="online-indicator"></view> -->
			</view>
		</template>
		<template v-slot:body>
			<view class="content">
				<view class="name-row">
					<text class="name">{{ linkman.name }}&nbsp;</text>
				</view>
				<text class="department">{{ linkman.department }}</text>
			</view>
		</template>
		<template v-slot:footer>
			<view class="person-icon">
				<image src="@/static/icons/person.png" class="person" mode="aspectFill" />
			</view>
		</template>
	</uni-list-item>
</template>

<script lang="ts" setup>
	import {
		defineProps
	} from 'vue'
	import { LinkManModel } from '@/models/LinkManModel'
	import { GET_PHOTO } from '@/api/api'


	const props = defineProps<{
		linkman : LinkManModel
	}>()

	function getFirstChar(name : string) {
		return name ? name.charAt(0).toUpperCase() : ''
	}

	const onItemClick = () => {
		console.log('linkmanListItem onclink');
		const agent_id = encodeURIComponent(props.linkman.agent_category_id ?? 'unKnow')
		const agentName = encodeURIComponent(props.linkman.name)

		uni.navigateTo({
			url: `/pages/chat/chat?agent_id=${agent_id}&agentName=${agentName}`
		})
	}
</script>

<style scoped lang="scss">
	image {
		width: 26rpx;
		height: 26rpx;
	}

	.avatar-container {
		width: 80rpx;
		height: 80rpx;
		margin-right: 20rpx;
		position: relative;
	}

	.avatar {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background-color: #1890ff;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		font-weight: bold;
	}

	.online-indicator {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 16rpx;
		height: 16rpx;
		background-color: #52c41a;
		border-radius: 50%;
		border: 2rpx solid #fff;
	}


	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;

		.name-row {
			display: flex;
			align-items: center;
			margin-bottom: 8rpx;

			.name {
				font-size: 28rpx;
				color: #333;
				font-weight: bolder;
			}
		}

		.department {
			font-size: 26rpx;
			color: #999;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	.person-icon {
		align-content: center;
		margin-right: 20rpx;
	}
</style>