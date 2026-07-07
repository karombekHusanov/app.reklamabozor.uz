<script setup lang="ts">
import { ROUTES } from '@/modules/shell/constants/routes'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useChatStore } from '@/modules/chat/stores/chat.store'
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

const activeIndex = computed(() => tabs.value.findIndex(tab => isActive(tab.to)))

const hasActiveTab = computed(() => activeIndex.value >= 0)

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
  <!-- Gradient stroke for the raised active icon -->
  <svg width="0" height="0" class="absolute" aria-hidden="true">
    <defs>
      <!-- userSpaceOnUse: objectBoundingBox gradients vanish on zero-height
           paths (e.g. the Plus icon's straight lines). Lucide icons share a
           24x24 viewBox, so user-space coords cover every icon. -->
      <linearGradient id="tab-bar-gradient" gradientUnits="userSpaceOnUse" x1="12" y1="0" x2="12" y2="24">
        <stop offset="0%" stop-color="#2b7fff" />
        <stop offset="100%" stop-color="#2dd4bf" />
      </linearGradient>
    </defs>
  </svg>

  <nav class="tab-bar-dock" aria-label="Main navigation">
    <div class="tab-bar-float">
      <!-- Sliding raised circle with gradient border, poking out of the bar top & bottom -->
      <div
        v-if="hasActiveTab"
        class="tab-bar-knob"
        :style="{ '--tab-active': activeIndex }"
        aria-hidden="true"
      >
        <div class="tab-bar-knob-circle" />
      </div>

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
          <!-- Gradient stroke is applied via CSS (`stroke: url(...)`): lucide
               overwrites a stroke attribute with its color prop, CSS wins. -->
          <component
            :is="tab.icon"
            class="tab-bar-icon"
            :stroke-width="isActive(tab.to) ? 2 : 1.75"
          />
          <span
            v-if="tab.badge && hasChatBadge"
            class="tab-bar-badge"
            :class="{ 'tab-bar-badge--active': isActive(tab.to) }"
            aria-hidden="true"
          />
        </span>
        <span
          class="tab-bar-label"
          :class="{ 'tab-bar-label--hidden': isActive(tab.to) }"
        >
          {{ tab.label }}
        </span>
      </button>
    </div>
  </nav>
</template>
