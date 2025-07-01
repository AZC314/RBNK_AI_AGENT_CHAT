// useMessageStore.ts
import {defineStore} from 'pinia'
import ChatMessage from '@/models/ChatMessage'
import {addMessageToDB, deleteMessagesById, getMessagesById, deleteMessagesByIds, getMessagesByChatId, openDB, clearAllMessagesFromDB} from '@/tools/ChatDB'
import {Info} from "../models/INFO";

const MESSAGE_MAP_STORAGE_KEY = 'chat_messages_map' // 已废弃
const CHATID_TO_MSGIDS_KEY = 'chatid_to_msgids_map'
const CHATID_TO_LASTLOADED_KEY = 'chatid_to_lastloaded_map'

export const useMessageStore = defineStore('message', {
    state: () => ({
        chatIdToMessageIds: {} as Record<string, string[]>,
        chatIdToLastLoadedAt: {} as Record<string, number>
    }),
    getters: {
        // getMessages返回Promise<Info.Message[]>，按id顺序从IndexedDB批量获取
        getMessages: (state) => async (key: string): Promise<Info.Message[]> => {
            const ids = state.chatIdToMessageIds[key] || [];
            if (ids.length === 0) return [];
            const results = await Promise.all(ids.map(id => getMessageById(id)));
            return results.filter(Boolean) as Info.Message[];
        },
        getLastLoadedAt: (state) => (key: string): number => {
            return state.chatIdToLastLoadedAt[key] || 0;
        }
    },
    actions: {
        // 加载本地chatIdToMessageIds
        loadFromStorage() {
            try {
                const idMap = uni.getStorageSync(CHATID_TO_MSGIDS_KEY)
                if (idMap) {
                    this.chatIdToMessageIds = idMap
                }
                const lastLoadedMap = uni.getStorageSync(CHATID_TO_LASTLOADED_KEY)
                if (lastLoadedMap) {
                    this.chatIdToLastLoadedAt = lastLoadedMap
                }
            } catch (e) {
                // ignore
            }
        },
        // 保存chatIdToMessageIds
        saveToStorage() {
            try {
                uni.setStorageSync(CHATID_TO_MSGIDS_KEY, this.chatIdToMessageIds)
                uni.setStorageSync(CHATID_TO_LASTLOADED_KEY, this.chatIdToLastLoadedAt)
            } catch (e) {
                // ignore
            }
        },
        // 加载某chatId所有消息id（不加载内容）
        async loadMessages(key: string) {
            const raw = await getMessagesByChatId(key)
            const formatted = raw.map(item => item as Info.Message)
            this.chatIdToMessageIds[key] = formatted
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map(m => m.message_id)
            this.chatIdToLastLoadedAt[key] = Date.now();
            this.saveToStorage()
        },
        // 添加消息
        async addMessage(key: string, message: any) {
            if (!this.chatIdToMessageIds[key]) {
                this.chatIdToMessageIds[key] = []
            }
            this.chatIdToMessageIds[key].push(message.message_id)
            await addMessageToDB({...message, chatId: String(key)})
            this.saveToStorage()
        },
        // 头部插入消息
        async unshiftAddMessage(key: string, message: any) {
            if (!this.chatIdToMessageIds[key]) {
                this.chatIdToMessageIds[key] = []
            }
            if (Array.isArray(message) && message.length > 0) {
                for (let i = message.length - 1; i >= 0; i--) {
                    this.chatIdToMessageIds[key].unshift(message[i].message_id)
                    await addMessageToDB({...message[i], chatId: String(key)})
                }
            } else if (message && typeof message === 'object') {
                this.chatIdToMessageIds[key].unshift(message.message_id)
                await addMessageToDB({...message, chatId: String(key)})
            } else {
                console.error('unshiftAddMessage: message is not a valid object or array', message)
            }
            this.saveToStorage()
        },
        // 删除某chatId所有消息
        async deleteMessages(key: string) {
            const ids = this.chatIdToMessageIds[key] || []
            this.chatIdToMessageIds[key] = []
            this.chatIdToLastLoadedAt[key] = 0
            if (ids.length > 0) {
                await deleteMessagesByIds(ids)
            }
            this.saveToStorage()
        },
        // 清空所有
        async clearAllMessages() {
            this.chatIdToMessageIds = {}
            this.chatIdToLastLoadedAt = {}
            uni.removeStorageSync(CHATID_TO_MSGIDS_KEY)
            uni.removeStorageSync(CHATID_TO_LASTLOADED_KEY)
            await clearAllMessagesFromDB()
        }
    }
})

// 新增：通过message_id从IndexedDB获取单条消息
async function getMessageById(messageId: string): Promise<Info.Message | null> {
    // 复用openDB
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction('messages', 'readonly');
        const store = tx.objectStore('messages');
        const req = store.get(messageId);
        req.onsuccess = () => {
            resolve(req.result as Info.Message || null);
        };
        req.onerror = () => {
            resolve(null);
        };
    });
}