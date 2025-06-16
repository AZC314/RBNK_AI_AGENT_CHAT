<template>
	<scroll-view class="session-list" scroll-y v-if="sessionList && sessionList.length > 0">
		<session-list-item-view v-for="session in sortedSessionList" :key="session.id" :session="session" />
	</scroll-view>
	<EmptyState v-else :showImage="false" message="暂无消息" bgc="#fff"/>
</template>

<script setup lang="ts">
	import {
		computed
	} from 'vue'
	import SessionListItemView from '@/components/sessionListItemView.vue'
	import EmptyState from '@/components/EmptyState.vue'
	import {SessionModel} from '@/models/sessionModel'

	const props = defineProps<{
	  sessionList: SessionModel[]
	}>()

	// 排序：先置顶再按时间
	const sortedSessionList = computed(() => {
		return props.sessionList
			.slice()
			.sort((a, b) => {
				if (a.isPinned && !b.isPinned) return -1
				if (!a.isPinned && b.isPinned) return 1
				return b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
			})
	})
</script>

<style lang="scss" scoped>
	.session-list {
		background-color: #f5f5f5;
	}
</style>