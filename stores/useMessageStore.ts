// useMessageStore.ts
import {defineStore} from 'pinia'
import ChatMessage from '@/models/ChatMessage'
import {addMessageToDB, deleteMessagesById, getMessagesById} from '@/tools/ChatDB'
import {Info} from "../models/INFO";

const MESSAGE_MAP_STORAGE_KEY = 'chat_messages_map'

export const useMessageStore = defineStore('message', {
    state: () => ({
        messagesMap: {} as Record<string, Info.message[]> // 每个会话的消息队列
    }),
    getters: {
        getMessages: (state) => (key: string): Info.message[] => {
            return state.messagesMap[key] || []
        }
    },

    actions: {
        // 加载本地消息
        loadFromStorage() {
            try {
                const stored = uni.getStorageSync(MESSAGE_MAP_STORAGE_KEY)
                if (stored) {
                    this.messagesMap = stored
                }
            } catch (e) {
                // ignore
            }
        },
        // 保存到本地
        saveToStorage() {
            try {
                uni.setStorageSync(MESSAGE_MAP_STORAGE_KEY, this.messagesMap)
            } catch (e) {
                // ignore
            }
        },
        async loadMessages(key: string) {
            const raw = await getMessagesById(key)
            const formatted = raw.map(item => item as Info.message)
            this.messagesMap[key] = formatted
            this.saveToStorage()
        },

        async addMessage(key: string, message: any) {
            if (!this.messagesMap[key]) {
                this.messagesMap[key] = []
            }
            this.messagesMap[key].push(message as Info.message)
            await addMessageToDB(message)
            this.saveToStorage()
        },
		async unshiftAddMessage(key: string, message: any) {
            if (!this.messagesMap[key]) {
                this.messagesMap[key] = []
            }
            
            try {
                console.log('unshiftAddMessage input:', message, 'type:', typeof message, 'isArray:', Array.isArray(message))
                
                // 判断message是数组还是单个对象
                if (Array.isArray(message) && message.length > 0) {
                    // 使用更安全的方式添加数组元素
                    for (let i = message.length - 1; i >= 0; i--) {
                        this.messagesMap[key].unshift(message[i])
                    }
                    // 遍历数组，为每个消息单独调用addMessageToDB
                    for (const msg of message) {
                        await addMessageToDB(msg)
                    }
                } else if (message && typeof message === 'object') {
                    // 单个消息对象
                    this.messagesMap[key].unshift(message)
            await addMessageToDB(message)
                } else {
                    console.error('unshiftAddMessage: message is not a valid object or array', message)
                }
            } catch (error) {
                console.error('unshiftAddMessage error:', error, message)
            }
            
            this.saveToStorage()
        },

        async deleteMessages(key: string) {
            this.messagesMap[key] = []
            await deleteMessagesById(key)
            this.saveToStorage()
        },
        // 新增：清空所有消息和本地存储
        clearAllMessages() {
            this.messagesMap = {}
            uni.removeStorageSync(MESSAGE_MAP_STORAGE_KEY)
        }
    }
})