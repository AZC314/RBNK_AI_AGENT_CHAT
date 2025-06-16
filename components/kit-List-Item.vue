<template>
	<uni-list-item clickable>
		<template v-slot:header>
			<view class="avatar-container">
				<image v-if="session.avatarUrl" :src="GET_PHOTO(session.avatarUrl)" class="avatar" mode="aspectFill" />
				<view v-else class="avatar-placeholder">
					{{ getFirstChar(session.username) }}
				</view>

				<!-- <view v-if="session.unreadCount > 0" class="unread-badge">
					<text class="unread-count">{{ formatUnreadCount(session.unreadCount) }}</text>
				</view> -->
			</view>
		</template>
		<template v-slot:body>
			<view class="content">
				<view class="name-row">
					<text class="name">{{ session.username }}&nbsp;</text>
					<view class="department">
						<text class="department-text">&nbsp;{{ department }}&nbsp;</text>
					</view>

				</view>
				<text class="last-message">{{ session.lastMessage }}</text>
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
	import { Session } from 'inspector';

	const props = defineProps<{
		session : SessionModel
	}>()

	const department = ref('')

	function getFirstChar(name : string) {
		return name ? name.charAt(0).toUpperCase() : ''
	}
	function formatUnreadCount(count : number) {
		if (count > 99) return '99+'
		return count.toString()
	}

	function navigateToChat() {
		// const id = encodeURIComponent(props.session.userId)
		// const title = encodeURIComponent(`${props.session.department} ${props.session.username}`)
		// url: `/pages/chat/chat?id=${id}&navbarTitle=${title}`
		uni.navigateTo({
			url: `/pages/chat/chat`
		})
	}
	/**
	 * 获取用户部门信息
	 * @param session 用户会话模型
	 * @returns 返回部门名称（Promise<string>）
	 */
	async function getDepartment(session ?: SessionModel) : Promise<string> {
		const data = session ?? props.session
		// 如果session中已有部门信息，直接返回
		if (data.department && data.department !== '') {
			console.log('getDepartment【原始数据】当前用户部门信息: ' + data.department);
			return data.department;
		}
		// 如果没有部门信息，则根据用户ID查询
		else {
			try {//todo agent查部门
				// 调用API获取部门信息
				const response = await GET_DEPARTMENTS_BY_ANGENT_ID(data.departmentId ?? 1);
				console.log('getDepartment【查询成功】部门数据: ' + JSON.stringify(response));
				const resData = response.data;
				// 返回部门描述，如果没有则返回空字符串
				const resurt = resData!.description;
				return resurt;
			} catch (err) {
				console.error('getDepartment【查询失败】获取部门信息错误: ' + JSON.stringify(err));
			}
			return ''; // 发生错误时返回空字符串
		}
	}

	onMounted(async () => {
		const dept = await getDepartment()
		department.value = dept
	})
</script>

<style lang="scss" scoped>
	.session-item {
		display: flex;
		padding: 20rpx;
		background-color: #f9fafb;
		position: relative;
	}

	.session-item.pinned {
		background-color: #FFEDED !important;
		/* 添加 !important 确保样式生效 */
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

	.unread-badge {
		position: absolute;
		top: -6rpx;
		right: -6rpx;
		min-width: 32rpx;
		height: 32rpx;
		background-color: #ff4d4f;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 6rpx;
		box-sizing: border-box;
	}

	.unread-count {
		color: #fff;
		font-size: 20rpx;
		font-weight: bold;
		line-height: 1;
	}

	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
	}

	.name-row {
		display: flex;
		align-items: center;
		margin-bottom: 8rpx;
	}

	.name {
		font-size: 28rpx;
		color: #333;
		font-weight: bolder;
		white-space: nowrap;
		/* 禁止换行 */
		overflow: hidden;
		/* 隐藏溢出内容 */
		text-overflow: ellipsis;
		/* 超出部分显示省略号 */
	}

	.department {
		display: flex;
		padding: 1rpx 4rpx;
		align-content: center;
		justify-content: center;
		border-radius: 30px;
		background-color: #f3f4f6;

		.department-text {
			font-size: 25rpx;
			font-weight: normal;
			color: #757575;
			white-space: nowrap;
			/* 禁止换行 */
			overflow: hidden;
			/* 隐藏溢出内容 */
			text-overflow: ellipsis;
			/* 超出部分显示省略号 */
		}
	}

	.last-message {
		font-size: 26rpx;
		color: #999;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.time {
		font-size: 24rpx;
		color: #999;
		margin-left: 20rpx;
		white-space: nowrap;
	}

	/* 下边框线，左右有间距 */
	.bottom-border {
		position: absolute;
		left: 30rpx;
		right: 30rpx;
		bottom: 0;
		height: 3rpx;
		background-color: #e0e0e0;
		z-index: 1;
	}
</style>