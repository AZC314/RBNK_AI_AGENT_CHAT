<template>
	<uni-list-item clickable>
		<template v-slot:header>
			<view class="avatar-container">
				<image :src="avatar" class="avatar" mode="aspectFill" />
				<!-- 	<view v-else class="avatar-placeholder">
					{{ getFirstChar(session.username) }}
				</view> -->

				<!-- <view v-if="session.unreadCount > 0" class="unread-badge">
					<text class="unread-count">{{ formatUnreadCount(session.unreadCount) }}</text>
				</view> -->
			</view>
		</template>
		<template v-slot:body>
			<view class="content">
				<view class="name-row">
					<text class="name">{{ session.username }}&nbsp;</text>
					<view class="department" v-if="department !== ''">
						<text class="department-text">&nbsp;{{ department }}&nbsp;</text>
					</view>

				</view>
				<view class="last-message" v-html="session.lastMessage"></view>
			</view>
		</template>
		<template v-slot:footer>
			<view class="time">
				{{ DateTool.formatTimeAgo(session.lastMessageTime) }}
			</view>
		</template>
	</uni-list-item>


</template>

<script lang="ts" setup>
	import { onMounted, ref, defineProps } from 'vue';
	import { DateTool } from '@/tools/dateTool'
	import { SessionModel } from '@/models/sessionModel'
	import { GET_DEPARTMENTS_BY_ANGENT_ID, GET_PHOTO } from '@/api/api'
	import GeneralServices from '@/api/GeneralServices'
	// import { Session } from 'inspector';
	import { useAvatarStore } from '@/stores/useAvatarStore'
	import { AppStorage } from '@/stores/AppStorage'
	import { LinkManModel } from '@/models/LinkManModel'
	import { ADDRESS } from '@/constances/constances'

	const avatarStore = useAvatarStore()
	const props = defineProps<{
		session : SessionModel
	}>()

	const department = ref('')
	const avatar = ref('/static/default-avatar.png')

	async function loadAvatar() {
		avatar.value = await avatarStore.getAvatarUrl(props.session.userId, props.session.avatarUrl)
	}

	function getFirstChar(name : string) {
		return name ? name.charAt(0).toUpperCase() : ''
	}
	function formatUnreadCount(count : number) {
		if (count > 99) return '99+'
		return count.toString()
	}

	onMounted(async () => {
		loadAvatar()
		const dept = await GeneralServices.getDepartmentInfo(props.session)
		department.value = dept?.department ?? ''
	})
</script>

<style lang="scss" scoped>
	.uni-list-item {
		background: transparent;
		padding: 0;
	}

	.avatar-container {
		width: 88rpx;
		height: 88rpx;
		margin-right: 24rpx;
		position: relative;
		flex-shrink: 0;
	}

	.avatar {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		border: 2rpx solid #f1f3f4;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		font-weight: 600;
		letter-spacing: 1rpx;
	}

	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
		min-width: 0;

		.name-row {
			display: flex;
			align-items: center;
			margin-bottom: 8rpx;

			.name {
				font-size: 30rpx;
				color: #222;
				font-weight: 600;
				line-height: 1.4;
				letter-spacing: 0.3rpx;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.department {
				display: flex;
				align-items: center;
				margin-left: 8rpx;

				.department-text {
					font-size: 26rpx;
					color: #222;
					background: #f4f6fa;
					border-radius: 999px;
					padding: 4rpx 12rpx;
					font-weight: 500;
					display: inline-block;
					line-height: 32rpx;
				}
			}
		}

		.last-message {
			font-size: 26rpx;
			color: #6c757d;
			line-height: 1.5;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			margin-bottom: 2rpx;
		}
	}

	.time {
		font-size: 22rpx;
		color: #bbb;
		margin-left: 12rpx;
		align-self: flex-end;
		white-space: nowrap;
	}
</style>