<template>
	<view>
		<uni-nav-bar color="#091020" background-color="#FFF" fixed="true" leftText="消息" :border="false"
			class="navbar"></uni-nav-bar>
		<view class="searchBox">
			<uni-search-bar v-model="searchText" placeholder="搜索" radius="10" cancelButton="none" bgColor="#f7f7f9"
				:input-style="inputStyle" :placeholder-style="placeholderStyle" />
		</view>
		<view class="search-result">
			<!-- 会话列表显示 -->
			<template v-if="filteredList && filteredList.length > 0">
				<uni-swipe-action>
					<uni-swipe-action-item v-for="session in filteredList" :key="session.userId" :auto-close="true"
						:right-options='getOptions(session.isPinned)' @click="bindClick(session,$event)">
						<view class="content-box" @click.stop="contentClick(session)">
							<kit-list-item :session="session" />
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action>
			</template>
			<!-- 加载状态显示 -->
			<template v-if="isLoading">
				<view class="loading-container">
					<uni-load-more status="loading" iconType="auto" />
				</view>
			</template>
			<!-- 空状态显示 -->
			<!-- <template v-else> -->
			<!-- <EmptyState /> -->
			<!-- </template> -->
		</view>
	</view>
</template>


<script lang="ts" setup>
	import {
		ref,
		onMounted,
		computed
	} from 'vue'
	import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
	import PinyinMatch from 'pinyin-match'
	import { DELETE_CONVERSATIONS, GET_CHAT_HISTORY, GET_ME_INFO } from '@/api/api'
	import GeneralServices from '@/api/GeneralServices'
	import { AppStorage } from '@/stores/AppStorage'
	import { useMessageStore } from '@/stores/useMessageStore'
	import { useChatSessionStore } from '@/stores/useChatSessionStore'
	import { ADDRESS, CURRENT_ANENT_INFO, USER_INFO } from '@/constances/constances'
	import { SessionModel } from '@/models/sessionModel'
	import { LinkManModel } from '@/models/LinkManModel'
	import ChatMessage, { UserInfo } from '@/models/ChatMessage'
	import { Info } from '@/models/INFO'
	import EmptyState from '@/components/EmptyState.vue'
	import kitListItem from '@/pages/message/kit/kit-List-Item.vue'


	// 保证输入框聚焦和失焦样式一致
	const inputStyle = 'color:#222;font-size:28px;font-weight:400;background:#fff;';
	const placeholderStyle = 'color:#bbb;font-size:22px;';

	// Store实例
	const sessionStore = useChatSessionStore()
	const messageStore = useMessageStore()

	// 响应式数据
	/** 搜索框输入内容 */
	const searchText = ref('')
	/** 会话列表（计算属性，从store获取） */
	const sessionList = computed(() => sessionStore.getSessions)
	/** 页面加载状态 */
	const isLoading = ref(false)
	/** 滑动操作锁定状态，防止误触 */
	const swipeLock = ref(false)


	/**
	 * 过滤会话列表（计算属性）
	 * 根据搜索关键词过滤会话列表，支持拼音匹配
	 */
	const filteredList = computed(() => {
		const keyword = searchText.value.trim().toLowerCase()
		if (!keyword) return sessionList.value

		return sessionList.value.filter(({ username = '', department = '' }) => {
			return (
				PinyinMatch.match(username, keyword) ||
				PinyinMatch.match(department, keyword)
			)
		})
	})

	/**
	 * 获取左滑操作选项
	 * @param isPinned 是否已置顶
	 * @returns 操作选项数组
	 */
	function getOptions(isPinned : boolean) {
		return [{
			text: isPinned ? '取消置顶' : '置顶',
			style: {
				backgroundColor: '#007aff'
			}
		},
		{
			text: '删除',
			style: {
				backgroundColor: '#F56C6C'
			}
		}
		]
	}

	/**
	 * 左滑操作按钮点击事件处理
	 * @param session 会话对象
	 * @param e 点击事件对象
	 */
	const bindClick = (session : SessionModel, e : any) => {
		swipeLock.value = true // 启用点击锁

		const action = e?.content?.text || e?.detail?.text || ''
		if (!action) return

		if (action.includes('置顶')) {
			// 切换置顶状态
			session.isPinned = !session.isPinned;
			// 排序后直接更新 sessionStore.getSessions
			const sorted = [...sessionStore.getSessions].sort((a, b) => {
				if (a.isPinned === b.isPinned) {
					return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
				}
				return a.isPinned ? -1 : 1;
			});
			sessionStore.getSessions.splice(0, sessionStore.getSessions.length, ...sorted);
		} else if (action === '删除') {
			// 删除会话
			/* todo 通过agentId删除所有和这个ai数字人相关的chat */
			// sessionStore.removeSession(session.userId)

			DELETE_CONVERSATIONS(session.conversation_id).then((res) => {
				console.log('DELETE_CONVERSATIONS success' + JSON.stringify(res));
				sessionStore.removeSession(session.userId);
				messageStore.deleteMessages(session.userId);
			})
				.catch((err) => {
					console.log('DELETE_CONVERSATIONS fail' + err.data.detail);
					console.log(err)
				})
		}

		// 延迟解锁，确保点击动画执行完
		setTimeout(() => {
			swipeLock.value = false
		}, 200)
	}

	/**
	 * 会话内容点击事件处理
	 * @param session 会话对象
	 */
	const contentClick = async (session : SessionModel) => {
		if (swipeLock.value) {
			console.log('[拦截] 按钮点击后触发，阻止跳转')
			return
		}

		const agent_id = encodeURIComponent(session.userId)

		// 通过GeneralServices获取联系人信息
		const linkman = await GeneralServices.getDepartmentInfo(session)
		const departmentName = linkman?.department || ''
		const departmentId = linkman?.departmentId ? linkman.departmentId.toString() : '0'

		// 构建当前代理信息
		const currentAgentInfo : UserInfo = {
			agentId: session.userId,
			username: session.username,
			face: session.avatarUrl,
			departmentName: departmentName,
			departmentId: +departmentId
		}

		// 存储当前代理信息并跳转到聊天页面
		AppStorage.set(CURRENT_ANENT_INFO, currentAgentInfo)
		uni.navigateTo({
			url: `../chat/chat?agent_id=${agent_id}&conversationId=${session.conversation_id}`
		})
	}

	/**
	 * 页面加载时执行
	 * @param options 页面参数
	 */
	onLoad((options) => {
		uni.startPullDownRefresh();
		/* todo 接收企微的数据  */
		if (options?.id) {
			// 处理企微数据（待实现）
		}

		// // 获取并处理用户信息
		// GeneralServices.preHandleSessionList({ page_size: 10, page: 1, sort_by: '-updated_at' }, () => {
		// 	// @ts-ignore
		// 	if (typeof uni !== 'undefined' && uni.stopPullDownRefresh) uni.stopPullDownRefresh()
		// })
	})

	/**
	 * 组件挂载时执行初始化
	 */
	onMounted(() => {
		isLoading.value = true
		try {
			// 初始化sessionStore并获取会话列表
			const currentSessions = sessionStore.getSessions
			console.log('当前会话列表长度:', currentSessions.length)
			if (currentSessions.length === 0) {
				console.log('会话列表为空，开始通过GeneralServices加载...')
				// 通过GeneralServices加载会话列表
				GeneralServices.preHandleSessionList({ page_size: 10, page: 1, sort_by: '-updated_at' }, () => {
					isLoading.value = false
				})
			} else {
				console.log('会话列表已存在')
				isLoading.value = false
			}
		} catch (error) {
			console.error('初始化会话列表失败:', error)
			uni.showToast({
				title: '加载会话列表失败',
				icon: 'error',
				duration: 2000
			})
			isLoading.value = false
		}
	})

	/**
	 * 下拉刷新处理函数
	 */
	onPullDownRefresh(() => {
		try {
			sessionStore.clearSessions();
			GeneralServices.handSessionList({ page_size: 10, sort_by: '-updated_at' },10, () => {
				uni.stopPullDownRefresh()
			})
		} catch (error) {
			console.error('下拉刷新失败:', error)
			uni.showToast({
				title: '刷新失败',
				icon: 'error',
				duration: 2000
			})
			uni.stopPullDownRefresh()
		}
	})
</script>

<style scoped lang="scss">
	::v-deep(.uni-navbar-left) {
		font-size: 32rpx !important;
		font-weight: 600;
		color: #1a1a1a;
	}


	.searchBox {
		width: 100%;
		padding: 16rpx 24rpx;
		background-color: #fdfdfe;
		border-bottom: 1rpx solid #e9ecef;
		box-sizing: border-box;
	}

	.search-result {
		background: #FFF;
		min-height: 0em;
		padding: 0;
		border-radius: 0 0 24rpx 24rpx;

		.loading-container {
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 40rpx 0;
		}


		.content-box {
			width: 100%;
			background-color: #fff;
			margin: 0;
			padding: 0;
			border-radius: 0;
			box-shadow: none;
			border-bottom: 1rpx solid #f0f0f0;
			transition: background 0.2s;

			&:last-child {
				border-bottom: none;
			}
		}

		.swipe-right-buttons {
			display: flex;
			height: 100%;
		}

		.slot-button {
			display: flex;
			height: 100%;
			flex: 1;
			flex-direction: row;
			justify-content: center;
			align-items: center;
			padding: 0 15px;
			background-color: #007aff;
			border-radius: 0 22px 22px 0;
		}

		.slot-button-del {
			display: flex;
			height: 100%;
			flex: 1;
			flex-direction: row;
			justify-content: center;
			align-items: center;
			padding: 0 15px;
			background-color: #ff5a5f;
			border-radius: 0 22px 22px 0;
		}

		.slot-button-text {
			color: #ffffff;
			font-size: 14px;
			white-space: nowrap
		}
	}
</style>