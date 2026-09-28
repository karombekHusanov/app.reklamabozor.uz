import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getApiErrorMessage } from '@/core/api/api-error'
import {
  RealtimeRpcError,
  RealtimeUnavailableError,
  useRealtimeStore,
  type RealtimeUserEvent,
} from '@/core/stores/realtime.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
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
import type { Chat, ChatMessage, ChatType } from '@/modules/chat/types/chat'

/** `chat.message` push on the personal channel. */
interface ChatMessageEvent {
  type: 'chat.message'
  chat_type: ChatType
  chat_id: number
  order_id: number | null
  message: ChatMessage
}

/** `chat.read` push — the other side read my messages. */
interface ChatReadEvent {
  type: 'chat.read'
  chat_type: ChatType
  chat_id: number
  reader_id: number
  read_at: string
}

/** RPC target: direct → direct chat id, order → order id (same ids as the HTTP routes). */
interface ChatTarget {
  type: ChatType
  id: number
}

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

  /** Re-read the open direct thread (header, offer state) without the loading skeleton. */
  async function refreshDirectThread(chatId: number) {
    try {
      const thread = await fetchDirectThread(chatId)
      if (currentChat.value?.id !== chatId) return
      currentChat.value = thread.chat
      messages.value = thread.messages
    }
    catch {
      // Keep what is on screen — the next open reloads it.
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

  /** Append unless already there (the socket push and the send reply race). */
  function appendMessage(message: ChatMessage) {
    if (!messages.value.some(m => m.id === message.id)) messages.value.push(message)
  }

  /**
   * Send over the socket (RPC) when it's up; HTTP only when it's offline —
   * never both, so a slow reply can't double-post.
   */
  async function sendVia(
    target: ChatTarget,
    body: string,
    fileIds: number[],
    http: () => Promise<ChatMessage>,
  ): Promise<boolean> {
    isSending.value = true
    error.value = null
    try {
      let message: ChatMessage
      try {
        const reply = await useRealtimeStore().rpc<{ message: ChatMessage }>('chat.send', {
          ...target,
          body: body || undefined,
          file_ids: fileIds.length > 0 ? fileIds : undefined,
        })
        message = reply.message
      }
      catch (e) {
        if (!(e instanceof RealtimeUnavailableError)) throw e
        message = await http()
      }
      appendMessage(message)
      return true
    }
    catch (e) {
      error.value = e instanceof RealtimeRpcError ? e.message : getApiErrorMessage(e)
      return false
    }
    finally {
      isSending.value = false
    }
  }

  async function send(orderId: number, body: string, fileIds: number[] = []) {
    return sendVia({ type: 'order', id: orderId }, body, fileIds, () => sendMessageRequest(orderId, body, fileIds))
  }

  async function sendDirect(chatId: number, body: string, fileIds: number[] = []) {
    return sendVia({ type: 'direct', id: chatId }, body, fileIds, () => sendDirectMessage(chatId, body, fileIds))
  }

  // ---- Realtime (Centrifugo `user:{id}` pushes) ----

  function isOpenChat(chatType: ChatType, chatId: number): boolean {
    return currentChat.value?.type === chatType && currentChat.value.id === chatId
  }

  /** The open thread's RPC target (order chats are addressed by order id). */
  function openTarget(): ChatTarget | null {
    const open = currentChat.value
    if (!open) return null
    if (open.type === 'order') return open.order_id ? { type: 'order', id: open.order_id } : null
    return { type: 'direct', id: open.id }
  }

  let readTimer: ReturnType<typeof setTimeout> | null = null

  /** Batch read receipts for the open thread (one RPC per burst of pushes). */
  function scheduleMarkRead() {
    if (readTimer) return
    readTimer = setTimeout(() => {
      readTimer = null
      const target = openTarget()
      if (target) void useRealtimeStore().rpc('chat.read', { ...target }).catch(() => {})
    }, 400)
  }

  function onMessagePush(event: ChatMessageEvent) {
    const me = useAuthStore().user?.id
    const mine = event.message.sender_id === me
    const open = isOpenChat(event.chat_type, event.chat_id)

    if (open) {
      appendMessage(event.message)
      if (!mine && document.visibilityState !== 'hidden') scheduleMarkRead()
    }

    const item = chats.value.find(c => c.type === event.chat_type && c.id === event.chat_id)
    if (!item) {
      // A thread we haven't listed yet (first otklik, new deal) — refresh the inbox.
      if (inboxLoaded.value) void loadChats(true)
      return
    }
    item.last_message = event.message
    item.updated_at = event.message.created_at
    if (!mine && !open) item.unread_count = (Number(item.unread_count) || 0) + 1
    chats.value = [item, ...chats.value.filter(c => c !== item)]
  }

  function onReadPush(event: ChatReadEvent) {
    const me = useAuthStore().user?.id
    if (event.reader_id === me || !isOpenChat(event.chat_type, event.chat_id)) return
    messages.value.forEach((m) => {
      if (m.sender_id === me && !m.read_at) m.read_at = event.read_at
    })
  }

  /** Catch up after the socket was down (pushes in between are lost). */
  function resync() {
    const open = currentChat.value
    if (open?.type === 'direct') void pollDirect(open.id)
    else if (open?.type === 'order' && open.order_id) void poll(open.order_id)
    if (inboxLoaded.value) void loadChats(true)
  }

  /** Leaving the thread screen: pushes for it must count as unread again. */
  function closeThread() {
    currentChat.value = null
    messages.value = []
  }

  let realtimeBound = false

  /** Wire the store to the socket once per app session. */
  function bindRealtime() {
    if (realtimeBound) return
    realtimeBound = true
    const realtime = useRealtimeStore()
    realtime.onUserEvent((event: RealtimeUserEvent) => {
      if (event.type === 'chat.message') onMessagePush(event as unknown as ChatMessageEvent)
      else if (event.type === 'chat.read') onReadPush(event as unknown as ChatReadEvent)
    })
    realtime.onReconnect(resync)
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
    refreshDirectThread,
    send,
    sendDirect,
    bindRealtime,
    closeThread,
    blockDirect,
    unblockDirect,
    reset,
  }
})
