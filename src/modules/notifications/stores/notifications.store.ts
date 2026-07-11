import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface AppNotification {
  id: number
  title: string
  body: string
  created_at: string
  read_at: string | null
  link_url: string | null
}

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<AppNotification[]>([])
  const hasLoaded = ref(false)
  const isLoading = ref(false)

  const unreadCount = computed(() => items.value.filter(item => !item.read_at).length)
  const hasUnread = computed(() => unreadCount.value > 0)

  async function load(force = false) {
    if (hasLoaded.value && !force) return

    isLoading.value = true
    try {
      // In-app notifications API is not wired yet — keep the page ready for it.
      items.value = []
      hasLoaded.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  function reset() {
    items.value = []
    hasLoaded.value = false
    isLoading.value = false
  }

  return {
    items,
    hasLoaded,
    isLoading,
    unreadCount,
    hasUnread,
    load,
    reset,
  }
})
