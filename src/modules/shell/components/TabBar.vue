<script setup lang="ts">
import { ROUTES } from '@/modules/shell/constants/routes'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ClipboardList, Home, Map, Plus, Users } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { haptic } = useTelegram()
const locale = useLocaleStore()

const tabs = computed(() => [
  { to: ROUTES.home, label: locale.t.shell.tabs.home, icon: Home },
  { to: ROUTES.marketplace, label: locale.t.shell.tabs.providers, icon: Users },
  { to: ROUTES.map, label: locale.t.shell.tabs.map, icon: Map },
  { to: ROUTES.orders, label: locale.t.shell.tabs.myOrders, icon: ClipboardList },
])

// Left pair / right pair flank the central FAB.
const leftTabs = computed(() => tabs.value.slice(0, 2))
const rightTabs = computed(() => tabs.value.slice(2))

const activePath = computed(() => route.path)

function navigate(to: string) {
  if (activePath.value === to) return
  haptic('light')
  router.push(to)
}

function createOrder() {
  haptic('medium')
  router.push(ROUTES.newOrder)
}
</script>

<template>
  <nav class="brand-hero safe-bottom fixed inset-x-0 bottom-0 z-50 rounded-t-3xl shadow-[0_-6px_24px_rgba(2,48,92,0.25)]">
    <div class="relative mx-auto flex max-w-lg items-end justify-between gap-1 px-4 pb-2 pt-3">
      <!-- Left pair -->
      <button
        v-for="tab in leftTabs"
        :key="tab.to"
        type="button"
        class="relative flex flex-1 flex-col items-center gap-1 py-1 transition-colors"
        :class="activePath === tab.to ? 'text-white' : 'text-white/55'"
        @click="navigate(tab.to)"
      >
        <component :is="tab.icon" class="size-5" />
        <span class="text-[10px] font-medium">{{ tab.label }}</span>
      </button>

      <!-- Center FAB (new order) -->
      <div class="flex shrink-0 justify-center" style="flex-basis: 4.5rem">
        <button
          type="button"
          class="btn-brand -mt-9 flex size-16 items-center justify-center rounded-full ring-4 ring-[#0a1a2f]/0 ring-offset-0 shadow-lg"
          style="box-shadow: 0 8px 24px rgba(3,134,217,0.5); border: 4px solid rgba(255,255,255,0.18)"
          @click="createOrder"
        >
          <Plus class="size-7 text-white" />
        </button>
      </div>

      <!-- Right pair -->
      <button
        v-for="tab in rightTabs"
        :key="tab.to"
        type="button"
        class="relative flex flex-1 flex-col items-center gap-1 py-1 transition-colors"
        :class="activePath === tab.to ? 'text-white' : 'text-white/55'"
        @click="navigate(tab.to)"
      >
        <component :is="tab.icon" class="size-5" />
        <span class="text-[10px] font-medium">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>
