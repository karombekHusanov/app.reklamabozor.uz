<script setup lang="ts">
import { ROUTES } from '@/modules/shell/constants/routes'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useChatStore } from '@/modules/chat/stores/chat.store'
import GlassCard from '@/core/ui/GlassCard.vue'
import { ClipboardList, Home, MessageCircle, Package, Plus } from '@lucide/vue'
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { haptic } = useTelegram()
const locale = useLocaleStore()
const auth = useAuthStore()
const chat = useChatStore()

const tabs = computed(() => [
  { key: 'home', to: ROUTES.home, label: locale.t.shell.tabs.home, icon: Home },
  { key: 'products', to: ROUTES.products, label: locale.t.shell.tabs.myProducts, icon: Package },
  { key: 'create', to: ROUTES.newOrder, label: locale.t.shell.tabs.create, icon: Plus },
  { key: 'chat', to: ROUTES.chat, label: locale.t.shell.tabs.chat, icon: MessageCircle, badge: true },
  { key: 'orders', to: ROUTES.orders, label: locale.t.shell.tabs.myOrders, icon: ClipboardList },
])

const hasChatBadge = computed(() =>
  chat.chats.some(item => item.unread_count > 0),
)

function isActive(to: string): boolean {
  const path = route.path
  if (to === ROUTES.home) return path === ROUTES.home
  if (to === ROUTES.newOrder) return path === ROUTES.newOrder
  if (to === ROUTES.orders) return path === ROUTES.orders || (path.startsWith('/orders/') && path !== ROUTES.newOrder)
  return path === to || path.startsWith(`${to}/`)
}

function navigate(to: string) {
  if (isActive(to)) return
  haptic(to === ROUTES.newOrder ? 'medium' : 'light')
  void router.push(to)
}

function loadChatBadge() {
  if (auth.isAuthenticated) void chat.loadChats()
}

onMounted(loadChatBadge)
watch(() => auth.isAuthenticated, loadChatBadge)
</script>

<template>
  <nav class="tab-bar-dock" aria-label="Main navigation">
    <GlassCard
      rounded
      frosted
      padding="pill"
      class="tab-bar-shell"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tab-bar-item"
        :class="{ 'tab-bar-item--active': isActive(tab.to) }"
        :aria-current="isActive(tab.to) ? 'page' : undefined"
        @click="navigate(tab.to)"
      >
        <span class="tab-bar-icon-slot">
          <component
            :is="tab.icon"
            class="tab-bar-icon"
            :stroke-width="isActive(tab.to) ? 2.25 : 2"
          />
          <span
            v-if="tab.badge && hasChatBadge"
            class="tab-bar-badge"
            aria-hidden="true"
          />
        </span>
        <span class="tab-bar-label">
          {{ tab.label }}
        </span>
      </button>
    </GlassCard>
  </nav>
</template>
