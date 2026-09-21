<script setup lang="ts">
import { Lock } from '@lucide/vue'
import { computed } from 'vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { OrderRoute } from '@/modules/orders/types/order'

const props = defineProps<{
  modelValue: OrderRoute
  /** Tender tab shows a lock — the account may not create tenders. */
  tenderLocked?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [route: OrderRoute] }>()

const locale = useLocaleStore()
const { haptic } = useTelegram()

const items = computed(() => [
  { key: 'tender' as const, label: locale.t.route.tender },
  { key: 'tezkor' as const, label: locale.t.route.tezkor },
])

const activeIndex = computed(() => (props.modelValue === 'tender' ? 0 : 1))

function pick(route: OrderRoute) {
  if (route === props.modelValue) return
  haptic('light')
  emit('update:modelValue', route)
}
</script>

<template>
  <div
    class="route-tabs"
    role="tablist"
    :aria-label="locale.t.route.tabsLabel"
  >
    <span
      class="route-tabs__pill"
      aria-hidden="true"
      :style="{ transform: `translateX(${activeIndex * 100}%)` }"
    />
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      role="tab"
      class="route-tabs__tab"
      :class="modelValue === item.key && 'is-active'"
      :aria-selected="modelValue === item.key"
      @click="pick(item.key)"
    >
      <Lock
        v-if="item.key === 'tender' && tenderLocked"
        class="size-3.5"
        aria-hidden="true"
      />
      <span class="truncate">{{ item.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.route-tabs {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 4px;
  border-radius: var(--rb-r-field);
  background: var(--secondary);
  border: 1px solid var(--border);
}
.route-tabs__pill {
  position: absolute;
  inset-block: 4px;
  left: 4px;
  width: calc(50% - 4px);
  border-radius: calc(var(--rb-r-field) - 4px);
  background: var(--card);
  box-shadow: var(--rb-elev-1);
  transition: transform var(--rb-dur-slow) var(--rb-ease);
}
.route-tabs__tab {
  position: relative;
  z-index: 1;
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  border: 0;
  background: none;
  border-radius: calc(var(--rb-r-field) - 4px);
  font-family: var(--rb-font-display);
  font-size: 13.5px;
  font-weight: 800;
  color: var(--muted-foreground);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color var(--rb-dur) var(--rb-ease);
}
.route-tabs__tab.is-active { color: var(--foreground); }
.route-tabs__tab:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }
@media (prefers-reduced-motion: reduce) {
  .route-tabs__pill { transition: none; }
}
</style>
