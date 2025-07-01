<template>
	<uni-list class="linkman-list" v-if="list && list.length > 0" scroll-y>
		<!-- 按部门分组显示 -->
		<view v-for="(group, department) in groupedContacts" :key="department" class="department-group">
			<!-- 部门标题 -->
			<view class="department-header">
				<text class="department-title">{{ department }}</text>
				<text class="member-count">{{ group.length }}</text>
			</view>

			<!-- 部门成员列表 -->
			<link-man-list-item-view v-for="linkman in group" :key="linkman.userId" :linkman="linkman" />
		</view>
	</uni-list>
	<EmptyState v-else :showImage="false" message="无联系人" />
</template>

<script setup lang="ts">
	import {
		computed
	} from 'vue'
	import LinkManListItemView from '@/pages/address/kit/linkManListItemView.vue'
	import EmptyState from '@/components/EmptyState.vue'
	import { LinkManModel } from '@/models/LinkManModel'

	const props = defineProps<{
		list : LinkManModel[]
	}>()

	// 分组通讯录：按 department 分组
	const groupedContacts = computed(() => {
		const groups : Record<string, LinkManModel[]> = {}

		props.list.forEach(list => {
			const dept = list.department || '未知分组'
			if (!groups[dept]) {
				groups[dept] = []
			}
			groups[dept].push(list)
		})

		// 进行排序
		const sortedEntries = Object.entries(groups)
			.sort(([keyA], [keyB]) => {
				// 保证 "未知分组" 排在最后
				if (keyA === '未知分组') return 1;
				if (keyB === '未知分组') return -1;
				return keyA.localeCompare(keyB);
			})
			.map(([key, arr]) => [
				key,
				arr.sort((a, b) => a.name.localeCompare(b.name)) // 每组内部按 name 排序
			]);

		// 还原为新的 Record<string, LinkManModel[]>
		const sortedData : Record<string, LinkManModel[]> = Object.fromEntries(sortedEntries);
		return sortedData;
	})
</script>

<style scoped lang="scss">
	/* 部门分组样式优化 */
	.department-group {
		margin-bottom: 24rpx;
		background: #fff;
		border-radius: 18rpx;
		box-shadow: 0 2px 8px rgba(180,200,220,0.04);
		overflow: hidden;
	}

	.department-header {
		height: 88rpx;
		padding: 0 32rpx;
		background-color: #f7f8fa;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1rpx solid #e9ecef;

		/* 部门标题样式优化 */
		.department-title {
			font-size: 28rpx;
			color: #222;
			font-weight: 600;
			letter-spacing: 0.5rpx;
		}

		/* 成员数量样式优化 */
		.member-count {
			display: flex;
			width: 48rpx;
			height: 48rpx;
			align-items: center;
			justify-content: center;
			font-size: 22rpx;
			color: #6c757d;
			background-color: #e9ecef;
			border-radius: 24rpx;
			font-weight: 500;
			line-height: 48rpx;
		}
	}
</style>