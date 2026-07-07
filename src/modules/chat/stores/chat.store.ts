import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getApiErrorMessage } from '@/core/api/api-error'
import {
  fetchChats,
  fetchMessages,
  fetchThread,
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

  /** Fetch messages newer than the last known one and append (poll tick). */
  async function poll(orderId: number) {
    try {
      const fresh = await fetchMessages(orderId, lastMessageId.value)
      if (fresh.length > 0) {
        const known = new Set(messages.value.map(m => m.id))
        messages.value.push(...fresh.filter(m => !known.has(m.id)))
      }
    }
    catch {
      // Polling failures are transient — the next tick retries.
    }
  }

  async function send(orderId: number, body: string) {
    isSending.value = true
    error.value = null
    try {
      const message = await sendMessageRequest(orderId, body)
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
    error.value = null
  }

  return {
    chats,
    isLoading,
    error,
    currentChat,
    messages,
    isLoadingThread,
    isSending,
    loadChats,
    openThread,
    poll,
    send,
    reset,
  }
})
