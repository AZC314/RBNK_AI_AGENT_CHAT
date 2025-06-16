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
	import LinkManListItemView from '@/components/linkManListItemView.vue'
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
	.department-header {
		padding: 16rpx 40rpx;
		background-color: #fcfcfd;
		display: flex;
		align-items: center;
		justify-content: space-between;

		.department-title {
			font-size: 25rpx;
			color: #666;
			font-weight: bold;
		}

		.member-count {
			display: flex;
			width: 40rpx;
			height: 40rpx;
			align-content: center;
			justify-content: center;
			font-size: 24rpx;
			color: #999;
			// margin-left: 8rpx;
			background-color: #e8e8eb;
			border-radius: 20rpx;
		}
	}
</style>