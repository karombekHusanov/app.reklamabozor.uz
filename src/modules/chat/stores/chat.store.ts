import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getApiErrorMessage } from '@/core/api/api-error'
import {
  fetchChats,
  fetchDirectMessages,
  fetchDirectThread,
  fetchGlobalUnread,
  fetchMessages,
  fetchThread,
  markGlobalChatRead,
  sendDirectMessage,
  sendMessage as sendMessageRequest,
  blockDirectChat,
  unblockDirectChat,
} from '@/modules/chat/services/chat.service'
import type { Chat, ChatMessage } from '@/modules/chat/types/chat'

export const useChatStore = defineStore('chat', () => {
  // Inbox.
  const chats = ref<Chat[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const inboxLoaded = ref(false)

  // Open thread.
  const currentChat = ref<Chat | null>(null)
  const messages = ref<ChatMessage[]>([])
  const isLoadingThread = ref(false)
  const isSending = ref(false)

  /** Coalesce parallel callers (Home mount + poll + visibility). */
  let chatsInflight: Promise<void> | null = null
  let globalUnreadInflight: Promise<void> | null = null

  const lastMessageId = computed(() =>
    messages.value.length > 0 ? messages.value[messages.value.length - 1]!.id : undefined,
  )

  /** Total unread across order/direct chats — from GET /chats, cached in Pinia. */
  const totalUnread = computed(() =>
    chats.value.reduce((sum, c) => sum + (Number(c.unread_count) || 0), 0),
  )

  /** Global chat unread — from GET /chat/global/unread, cached in Pinia. */
  const globalUnread = ref(0)

  /** Refresh the global-chat unread count from the server. */
  async function loadGlobalUnread() {
    if (globalUnreadInflight) return globalUnreadInflight

    globalUnreadInflight = (async () => {
      try {
        const { count } = await fetchGlobalUnread()
        globalUnread.value = count
      }
      catch {
        // Transient — keep the previous value.
      }
    })().finally(() => {
      globalUnreadInflight = null
    })

    return globalUnreadInflight
  }

  /** Mark the global feed read on the server (opening / viewing the page). */
  async function markGlobalSeen(maxId?: number) {
    try {
      const { count } = await markGlobalChatRead(maxId)
      globalUnread.value = count
    }
    catch {
      // Optimistic clear so the home badge drops even if the request flakes.
      globalUnread.value = 0
    }
  }

  /** Zero the inbox badge for a chat after the server marks it read on open. */
  function clearLocalUnread(matcher: (c: Chat) => boolean) {
    const item = chats.value.find(matcher)
    if (item && item.unread_count > 0) {
      item.unread_count = 0
    }
  }

  async function loadChats(force = false) {
    if (inboxLoaded.value && !force) return
    if (chatsInflight) return chatsInflight

    chatsInflight = (async () => {
      isLoading.value = true
      error.value = null
      try {
        const items = await fetchChats()
        // Normalize so Home `badge > 0` checks never see string "0" / null.
        chats.value = items.map(item => ({
          ...item,
          unread_count: Number(item.unread_count) || 0,
        }))
        inboxLoaded.value = true
      }
      catch (e) {
        error.value = getApiErrorMessage(e)
      }
      finally {
        isLoading.value = false
      }
    })().finally(() => {
      chatsInflight = null
    })

    return chatsInflight
  }

  /** Home badge refresh — both endpoints, coalesced. */
  async function loadBadges(force = false) {
    await Promise.all([loadChats(force), loadGlobalUnread()])
  }

  async function openThread(orderId: number) {
    isLoadingThread.value = true
    error.value = null
    currentChat.value = null
    messages.value = []
    try {
      const thread = await fetchThread(orderId)
      currentChat.value = thread.chat
      messages.value = thread.messages
      clearLocalUnread(c => c.type === 'order' && c.order_id === orderId)
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isLoadingThread.value = false
    }
  }

  async function openDirectThread(chatId: number) {
    isLoadingThread.value = true
    error.value = null
    currentChat.value = null
    messages.value = []
    try {
      const thread = await fetchDirectThread(chatId)
      currentChat.value = thread.chat
      messages.value = thread.messages
      clearLocalUnread(c => c.type === 'direct' && c.id === chatId)
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isLoadingThread.value = false
    }
  }

  /** Fetch messages newer than the last known one and append (poll tick). */
  async function poll(orderId: number) {
    try {
      const fresh = await fetchMessages(orderId, lastMessageId.value, { skipErrorToast: true })
      if (fresh.length > 0) {
        const known = new Set(messages.value.map(m => m.id))
        messages.value.push(...fresh.filter(m => !known.has(m.id)))
      }
    }
    catch {
      // Polling failures are transient — the next tick retries.
    }
  }

  async function pollDirect(chatId: number) {
    try {
      const fresh = await fetchDirectMessages(chatId, lastMessageId.value, { skipErrorToast: true })
      if (fresh.length > 0) {
        const known = new Set(messages.value.map(m => m.id))
        messages.value.push(...fresh.filter(m => !known.has(m.id)))
      }
    }
    catch {
      // Polling failures are transient — the next tick retries.
    }
  }

  async function send(orderId: number, body: string, fileIds: number[] = []) {
    isSending.value = true
    error.value = null
    try {
      const message = await sendMessageRequest(orderId, body, fileIds)
      messages.value.push(message)
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSending.value = false
    }
  }

  async function sendDirect(chatId: number, body: string, fileIds: number[] = []) {
    isSending.value = true
    error.value = null
    try {
      const message = await sendDirectMessage(chatId, body, fileIds)
      messages.value.push(message)
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSending.value = false
    }
  }

  async function blockDirect(chatId: number) {
    error.value = null
    try {
      const updated = await blockDirectChat(chatId)
      currentChat.value = { ...currentChat.value, ...updated } as Chat
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
  }

  async function unblockDirect(chatId: number) {
    error.value = null
    try {
      const updated = await unblockDirectChat(chatId)
      currentChat.value = { ...currentChat.value, ...updated } as Chat
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
  }

  function reset() {
    chats.value = []
    currentChat.value = null
    messages.value = []
    inboxLoaded.value = false
    globalUnread.value = 0
    error.value = null
    chatsInflight = null
    globalUnreadInflight = null
  }

  return {
    chats,
    totalUnread,
    globalUnread,
    loadGlobalUnread,
    loadBadges,
    markGlobalSeen,
    isLoading,
    error,
    currentChat,
    messages,
    isLoadingThread,
    isSending,
    loadChats,
    openThread,
    openDirectThread,
    poll,
    pollDirect,
    send,
    sendDirect,
    blockDirect,
    unblockDirect,
    reset,
  }
})
