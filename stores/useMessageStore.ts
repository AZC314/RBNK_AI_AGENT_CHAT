// useMessageStore.ts
import {defineStore} from 'pinia'
import ChatMessage from '@/models/ChatMessage'
import {addMessageToDB, deleteMessagesById, getMessagesById} from '@/tools/ChatDB'
import {Info} from "../models/INFO";

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
        async loadMessages(key: string) {
            const raw = await getMessagesById(key)
            const formatted = raw.map(item => item as Info.message)
            this.messagesMap[key] = formatted
        },

        async addMessage(key: string, message: any) {
            if (!this.messagesMap[key]) {
                this.messagesMap[key] = []
            }
            this.messagesMap[key].push(message as Info.message)
            await addMessageToDB(message)
        },

        async deleteMessages(key: string) {
            this.messagesMap[key] = []
            await deleteMessagesById(key)
        }
    }
})