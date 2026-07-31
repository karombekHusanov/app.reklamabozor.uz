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
  sendDirectMessage,
  sendMessage as sendMessageRequest,
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

  const lastMessageId = computed(() =>
    messages.value.length > 0 ? messages.value[messages.value.length - 1]!.id : undefined,
  )

  /** Total unread messages across every order/direct chat — drives the home badge. */
  const totalUnread = computed(() =>
    chats.value.reduce((sum, c) => sum + (c.unread_count || 0), 0),
  )

  // ---- Global chat unread (client-tracked cursor) ----
  const GLOBAL_SEEN_KEY = 'adspace_global_seen'
  const globalUnread = ref(0)

  function globalSeenId(): number | null {
    try {
      const raw = localStorage.getItem(GLOBAL_SEEN_KEY)
      const n = raw != null ? Number(raw) : Number.NaN
      return Number.isInteger(n) && n >= 0 ? n : null
    }
    catch {
      return null
    }
  }

  function persistGlobalSeen(id: number) {
    try {
      localStorage.setItem(GLOBAL_SEEN_KEY, String(id))
    }
    catch {
      // Private mode / Telegram WebView may block storage — badge just resets.
    }
  }

  /** Refresh the global-chat unread count against the stored cursor. */
  async function loadGlobalUnread() {
    try {
      const seen = globalSeenId()
      const { count, latest_id } = await fetchGlobalUnread(seen ?? undefined)

      // First run: adopt the current head as "seen" so we don't flash a badge
      // for the entire backlog.
      if (seen === null) {
        persistGlobalSeen(latest_id)
        globalUnread.value = 0
        return
      }

      globalUnread.value = count
    }
    catch {
      // Transient — keep the previous value.
    }
  }

  /** Mark the global chat read up to `maxId` (called when the user views it). */
  function markGlobalSeen(maxId: number) {
    const seen = globalSeenId()
    if (seen === null || maxId > seen) {
      persistGlobalSeen(maxId)
    }
    globalUnread.value = 0
  }

  async function loadChats(force = false) {
    if (inboxLoaded.value && !force) return

    isLoading.value = true
    error.value = null
    try {
      chats.value = await fetchChats()
      inboxLoaded.value = true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
    }
    finally {
      isLoading.value = false
    }
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

  function reset() {
    chats.value = []
    currentChat.value = null
    messages.value = []
    inboxLoaded.value = false
    globalUnread.value = 0
    error.value = null
  }

  return {
    chats,
    totalUnread,
    globalUnread,
    loadGlobalUnread,
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
    reset,
  }
})
