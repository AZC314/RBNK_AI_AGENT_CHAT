<template>
	<view>
		<uni-nav-bar color="#091020" background-color="#FFF" fixed="true" leftText="消息" :border="false"
			class="navbar"></uni-nav-bar>
		<view class="searchBox">
			<uni-search-bar v-model="searchText" placeholder="搜索" radius="10" cancelButton="none" bgColor="#f7f7f9" />
		</view>
		<view class="search-result">
			<template v-if="filteredList && filteredList.length > 0">
				<uni-swipe-action>
					<uni-swipe-action-item v-for="session in filteredList" :key="session.userId" :auto-close="true"
						:right-options='getOptions(session.isPinned)' @click="bindClick(session,$event)">
						<view class="content-box" @click.stop="contentClick(session)">
							<kit-list-item :session="session" />
						</view>
					</uni-swipe-action-item>
					<!-- <uni-load-more :status="loading" iconType="auto" /> -->
				</uni-swipe-action>
			</template>
			<template v-else>
				<EmptyState />
			</template>
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
	import { SessionModel } from '@/models/sessionModel'
	import EmptyState from '@/components/EmptyState.vue'
	import { DateTool } from '@/tools/DateTool.ts'
	import { ImgTool } from '@/tools/imgTool'
	import SessionListItemView from '@/components/sessionListItemView.vue'
	import kitListItem from '@/components/kit-List-Item.vue'
	import { DELETE_CONVERSATIONS, GET_CHAT_HISTORY, GET_DEPARTMENTS_BY_ANGENT_ID, GET_ME_INFO } from '@/api/api'
	import { AppStorage } from '@/stores/AppStorage'
	import { Info } from '@/models/INFO.ts'
	import { useMessageStore } from '@/stores/useMessageStore'
	import { useChatSessionStore } from '@/stores/useChatSessionStore'
	import ChatMessage, { UserInfo } from 'models/ChatMessage'
	import { CURRENT_ANENT_INFO, USER_INFO } from '@/constances/constances'

	// 声明全局类型
	declare const uni : any
	declare const getCurrentPages : () => any[]
	const sessionStore = useChatSessionStore()
	const messageStore = useMessageStore()

	//搜索框内容
	const searchText = ref('')
	//消息列尔
	const sessionList = computed(() => sessionStore.getSessions)
	//当前用户信息
	const userInfo = ref<Info.User>()


	const init = async () => {
		// 初始化store并检查是否需要更新
		const needUpdate = await sessionStore.initStore()

		if (needUpdate) {
			handSessionList(new Object({ page_size: 40, sort_by: '-updated_at' }))
		}
	}

	function handleMeInfo(callback : (userInfo : Info.User) => void) {
		GET_ME_INFO()
			.then((res) => {
				console.log('GET_ME_INFO 成功：', JSON.stringify(res));

				if (res?.data) {
					callback(res.data as Info.User);
				} else {
					console.warn('GET_ME_INFO 返回数据为空');
				}
			})
			.catch((err) => {
				console.error('GET_ME_INFO 失败：', err);
			});
	}

	function handSessionList(params : object) {
		GET_CHAT_HISTORY(params).then((res) => {
			console.log('GET_CHAT_HISTORY Sessaces', JSON.stringify(res));
			if (res) {
				HandleChatHistory(res as Info.ChatHistoryContext)
				// AppStorage.set('chatHistory', res as Info.ChatHistoryContext)
			}
		})
	}


	//首次进入加载聊天session记录
	function HandleChatHistory(orginalContext : Info.ChatHistoryContext) {

		//总页数
		let total_pages = orginalContext.total_pages;
		//当前页数
		let page = orginalContext.page;
		//有用项数
		let usefulItem = sessionStore.getSessions.length ?? 0;
		// const chatSessionStore = useChatSessionStore()
		// const sessionsMap = new Map<number, Info.ChatHistory[]>()

		//压入数据
		// 设置会话列表
		usefulItem += sessionStore.setSessionList(orginalContext.items)
		console.log('usefulItem ' + usefulItem + 'total_pages' + total_pages + "page" + page);
		if (usefulItem >= 10 || page >= total_pages) {
			AppStorage.set('sessionList', sessionStore.getSessions)
			console.log('最终的sessionList' + JSON.stringify(AppStorage.get('sessionList')));
			// 停止下拉刷新动画
			uni.stopPullDownRefresh()
		} else {
			handSessionList(new Object({ page_size: orginalContext.page_size, page: orginalContext.page + 1, sort_by: '-updated_at' }))
		}
	}


	function setIconClickEvent() {
		console.log('message点击右上角设置按钮')
	}
	//过滤列表
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

	//左滑选项
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

	const swipeLock = ref(false)

	// 操作按钮点击事件
	const bindClick = (session : SessionModel, e : any) => {
		swipeLock.value = true // 启用点击锁

		const action = e?.content?.text || e?.detail?.text || ''
		if (!action) return

		if (action.includes('置顶')) {
			session.isPinned = !session.isPinned
			sessionList.value = [...sessionList.value].sort((a, b) => {
				if (a.isPinned && !b.isPinned) return -1
				if (!a.isPinned && b.isPinned) return 1
				return b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
			})
		} else if (action === '删除') {
			let agentId = session.userId;
			let conversationList = [];
			/* todo 通过agentId删除所有和这个ai数字人相关的chat */
			sessionStore.removeSession(session.userId)
			// sessionList.value = sessionStore.getSessions


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

	// 内容点击事件
	const contentClick = (session : SessionModel) => {
		if (swipeLock.value) {
			console.log('[拦截] 按钮点击后触发，阻止跳转')
			return
		}

		const agent_id = encodeURIComponent(session.userId)
		const currentAgentInfo : UserInfo = {
			agentId: session.userId,
			username: session.username,
			face: session.avatarUrl,
			departmentName: '数据管理部',
			departmentId:1
		}
		AppStorage.set(CURRENT_ANENT_INFO, currentAgentInfo)
		uni.navigateTo({
			url: `../chat/chat?agent_id=${agent_id}&conversationId=${session.conversation_id}`
		})
	}

	const formatTime = (date : Date) => {
		const now = Date.now()
		const diff = now - date.getTime()
		const oneDay = 24 * 60 * 60 * 1000
		if (diff < oneDay) return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
		return new Date(date).toLocaleDateString('zh-CN')
	}

	onMounted(() => {
		init()
	})

	// 接收页面参数
	onLoad((options) => {
		uni.startPullDownRefresh();
		/* todo 接收企微的数据  */
		if (options?.id) {

		}

		const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTAzODQ0NTUsInN1YiI6IjE4In0.krQ9KGQYs9ci0iOE2QxmqxwcC_snc1-UKuUgo_bzUpQ';
		AppStorage.set('token', token)
		handleMeInfo((data : Info.User) => {
			const old = AppStorage.get(USER_INFO) as Info.User
			messageStore.loadFromStorage()
			if (old.id != data.id) {
				AppStorage.set(USER_INFO, data)
				messageStore.clearAllMessages()
			}
		})
	})

	// 下拉刷新处理函数
	onPullDownRefresh(async () => {
		try {
			// 强制刷新会话列表
			sessionStore.clearSessions();
			handSessionList(new Object({ page_size: 40, sort_by: '-updated_at' }))
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
		font-size: 36rpx !important;
		font-weight: bold;
	}

	.searchBox {
		width: 96vw;
		padding: 10rpx 2vw;
		background-color: #fdfdfe;
	}

	.search-result {
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
		}

		.slot-button-text {
			color: #ffffff;
			font-size: 14px;
			white-space: nowrap
		}

		.content-box {
			width: 100%;
			background-color: #ffffff;
		}
	}
</style>