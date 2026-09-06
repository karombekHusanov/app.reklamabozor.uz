<script setup lang="ts">
import { ROUTES } from '@/modules/shell/constants/routes'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ClipboardList, Home, Package, Plus, User } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { haptic } = useTelegram()
const locale = useLocaleStore()

const tabs = computed(() => [
  { key: 'home', to: ROUTES.home, label: locale.t.shell.tabs.home, icon: Home, fab: false },
  { key: 'products', to: ROUTES.products, label: locale.t.shell.tabs.myProducts, icon: Package, fab: false },
  { key: 'create', to: ROUTES.newOrder, label: locale.t.shell.tabs.create, icon: Plus, fab: true },
  { key: 'orders', to: ROUTES.orders, label: locale.t.shell.tabs.myOrders, icon: ClipboardList, fab: false },
  { key: 'profile', to: ROUTES.profile, label: locale.t.shell.tabs.profile, icon: User, fab: false },
])

function isActive(to: string): boolean {
  const path = route.path
  if (to === ROUTES.home) return path === ROUTES.home
  if (to === ROUTES.newOrder) return path === ROUTES.newOrder
  if (to === ROUTES.orders) return path === ROUTES.orders || (path.startsWith('/orders/') && path !== ROUTES.newOrder)
  if (to === ROUTES.profile) return path === ROUTES.profile
  return path === to || path.startsWith(`${to}/`)
}

function navigate(to: string) {
  if (isActive(to)) return
  haptic(to === ROUTES.newOrder ? 'medium' : 'light')
  void router.push(to)
}
</script>

<template>
  <nav
    class="tab-bar-dock"
    aria-label="Main navigation"
  >
    <div class="tabbar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tab"
        :class="{ 'tab--active': isActive(tab.to), 'tab--fab': tab.fab }"
        :aria-current="isActive(tab.to) ? 'page' : undefined"
        @click="navigate(tab.to)"
      >
        <template v-if="tab.fab">
          <span class="fab">
            <component
              :is="tab.icon"
              class="size-6"
              :stroke-width="2.4"
            />
          </span>
          <span class="tab__lbl tab__lbl--fab">{{ tab.label }}</span>
        </template>
        <template v-else>
          <component
            :is="tab.icon"
            class="tab__ic"
            :stroke-width="isActive(tab.to) ? 2.35 : 2"
          />
          <span class="tab__lbl">{{ tab.label }}</span>
        </template>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.tabbar {
  pointer-events: auto;
  width: 100%;
  max-width: 32rem;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: end;
  padding: 8px 14px calc(9px + env(safe-area-inset-bottom));
  background: color-mix(in srgb, var(--card) 92%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid var(--border);
  box-shadow: var(--rb-elev-bar);
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: 0;
  cursor: pointer;
  padding: 4px 0;
  color: var(--muted-foreground);
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  transition: color var(--rb-dur) var(--rb-ease);
  -webkit-tap-highlight-color: transparent;
}
.tab--active { color: var(--primary); }
.tab:active { opacity: 0.85; }
.tab:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 12px; }

.tab__ic {
  width: 22px;
  height: 22px;
  color: var(--muted-foreground);
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: color var(--rb-dur) var(--rb-ease);
}
.tab--active .tab__ic { color: var(--primary); }

.tab__lbl {
  max-width: 100%;
  line-height: 1;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tab--active .tab__lbl { font-weight: 700; }

/* raised coral FAB (Create) */
.tab--fab .fab {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  margin-top: -26px;
  background: linear-gradient(180deg, var(--rb-cta) 0%, var(--rb-cta-strong) 100%);
  color: #fff;
  display: grid;
  place-items: center;
  border: 4px solid var(--card);
  box-shadow: var(--rb-elev-cta);
  transition: transform .14s ease;
}
.tab--fab:active .fab { transform: scale(0.92); }
.tab__lbl--fab { color: var(--rb-cta); font-weight: 800; margin-top: 3px; }

@media (prefers-reduced-motion: reduce) {
  .tab, .tab__ic, .tab--fab .fab { transition: none; }
}
</style>
