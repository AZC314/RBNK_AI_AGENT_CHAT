// useChatSessionStore.ts
import { defineStore } from 'pinia'
import type { Info } from '@/models/Info'
import { SessionModel } from '@/models/SessionModel'
import { AppStorage } from './AppStorage'

const SESSION_STORAGE_KEY = 'chat_sessions'
const LAST_UPDATE_TIME_KEY = 'chat_sessions_last_update'
const UPDATE_INTERVAL = 5 * 60 * 1000 // 5分钟，单位：毫秒

export const useChatSessionStore = defineStore('chatSession', {
	state: () => ({
		sessions: [] as SessionModel[],
		lastUpdateTime: 0 as number,
		// currentConversationId: '' as string,
	}),

	getters: {
		getSessions() : SessionModel[] {
			return this.sessions
		},


	},

	actions: {
		// 初始化store，从本地存储加载数据
		async initStore() {
			try {
				const storedSessions = AppStorage.get(SESSION_STORAGE_KEY)
				const lastUpdateTime = AppStorage.get(LAST_UPDATE_TIME_KEY) || 0

				if (storedSessions) {
					this.sessions = storedSessions.map((session : any) => {
						// 确保日期对象被正确转换
						if (session.lastMessageTime) {
							session.lastMessageTime = new Date(session.lastMessageTime)
						}
						return new SessionModel(session)
					})
				}

				this.lastUpdateTime = lastUpdateTime

				// 检查是否需要更新数据
				const now = Date.now()
				if (now - this.lastUpdateTime > UPDATE_INTERVAL) {
					return true // 需要更新
				}
				return false // 不需要更新
			} catch (error) {
				console.error('初始化会话存储失败:', error)
				return true // 发生错误时也更新
			}
		},

		// 保存数据到本地存储
		saveToStorage() {
			try {
				AppStorage.set(SESSION_STORAGE_KEY, this.sessions)
				AppStorage.set(LAST_UPDATE_TIME_KEY, Date.now())
			} catch (error) {
				console.error('保存会话数据失败:', error)
			}
		},

		// 设置或更新单个 session（基于 userId）
		addOrUpdateSession(item : Info.ChatHistory | SessionModel) {
			let data : SessionModel =
				item instanceof SessionModel ? item :
					SessionModel.chatHistory2SessionModel(item as Info.ChatHistory)

			const index = this.sessions.findIndex(s => s.userId === data.userId)

			if (index !== -1) {
				// 已存在，比较更新时间
				const existing = this.sessions[index]
				if (data.lastMessageTime.getTime() > existing.lastMessageTime.getTime()) {
					this.sessions[index] = data
				}
				this.saveToStorage()
				return index + 1 // 未插入，是更新 返回下标
			} else {
				this.sessions.push(data)
				this.saveToStorage()
				return this.sessions.length // 新插入返回下标
			}
		},

		// 批量设置/合并 sessions
		setSessionList(list : (Info.ChatHistory | SessionModel)[]) : number {
			let insertedCount = 0

			for (const item of list) {
				const session = item instanceof SessionModel ? item : SessionModel.chatHistory2SessionModel(item)

				const index = this.sessions.findIndex(s => s.userId === session.userId)

				if (index !== -1) {
					// 已存在，更新时间较晚的
					const existing = this.sessions[index]
					if (session.lastMessageTime.getTime() > existing.lastMessageTime.getTime()) {
						this.sessions[index] = session
					}
				} else {
					this.sessions.push(session)
					insertedCount++
				}
			}

			this.saveToStorage()
			return insertedCount
		},

		// 清空 sessions
		clearSessions() {
			this.sessions = []
			this.saveToStorage()
		},

		// 删除某个会话
		removeSession(agentId : string) {
			this.sessions = this.sessions.filter(item => item.userId !== agentId)
			this.saveToStorage()
		},
		getSessionByAgentId(agentId ?: number) : SessionModel {
			let id = agentId ? agentId : AppStorage.get('currentAgentId') as number
			console.log('getSessionByAgentId id = ' + id)
			const index = this.sessions.findIndex(elem => elem.userId === id.toString())
			console.log('getSessionByAgentId Sessaces ' + JSON.stringify(this.sessions[index]))
			return this.sessions[index]
		},

		// setCurrentConversationId(currentConversationId : string) {
		// 	this.currentConversationId = currentConversationId;
		// },
		// getCurrentConversationId() {
		// 	return this.currentConversationId;
		// }
	}
})