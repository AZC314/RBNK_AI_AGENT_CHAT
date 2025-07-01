const DB_NAME = 'IMChatDB'
const DB_VERSION = 2
const STORE_NAME = 'messages'

/** 打开 IndexedDB 数据库 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'message_id' })
      }
    }
  })
}

/** 添加消息*/
export async function addMessageToDB(message: any) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  // 自动补充chatId字段，强制为字符串
  let chatId = message.chatId
  if (!chatId) {
    if (message.msg && message.msg.agentId) {
      chatId = message.msg.agentId
    } else if (message.msg && message.msg.chatId) {
      chatId = message.msg.chatId
    }
  }
  if (chatId !== undefined && chatId !== null) {
    message.chatId = String(chatId)
  } else {
    // 没有chatId则不写入
    return Promise.resolve(false)
  }

  store.put(message)

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

/** 获取会话的所有消息 */
export async function getMessagesById(conversationId: string) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const all: any[] = []

  return new Promise<any[]>((resolve) => {
    const req = store.openCursor()
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        if (cursor.value?.msg?.conversationId === conversationId) {
          all.push(cursor.value)
        }
        cursor.continue()
      } else {
        resolve(all)
      }
    }
  })
}

/** 删除某个会话的所有消息 */
export async function deleteMessagesById(conversationId: string) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  return new Promise((resolve) => {
    const req = store.openCursor()
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        if (cursor.value?.msg?.conversationId === conversationId) {
          store.delete(cursor.primaryKey)
        }
        cursor.continue()
      } else {
        tx.oncomplete = () => resolve(true)
      }
    }
  })
}

/** 批量删除消息 */
export async function deleteMessagesByIds(messageIds: string[]) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  for (const id of messageIds) {
    store.delete(id)
  }
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true)
  })
}

/** 通过chatId获取所有消息 */
export async function getMessagesByChatId(chatId: string) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const all: any[] = []

  return new Promise<any[]>((resolve) => {
    const req = store.openCursor()
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        if (String(cursor.value?.chatId) === String(chatId)) {
          all.push(cursor.value)
        }
        cursor.continue()
      } else {
        resolve(all)
      }
    }
  })
}

/** 清空所有消息 */
export async function clearAllMessagesFromDB() {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.clear()
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true)
  })
}
