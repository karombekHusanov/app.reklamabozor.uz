<script setup lang="ts">
import { CircleHelp, MessageCircleMore, Rows2, UserRound, Wallet } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { fmtSom, passStrings } from '@/modules/agent/lib/pass-i18n'
import { usePassStore } from '@/modules/agent/stores/pass.store'
import { useHomeStore } from '@/modules/home/stores/home.store'
import { ROUTES } from '@/modules/shell/constants/routes'

/** Flat, always-visible footer of the Agent workspace (Profi-style). */
const route = useRoute()
const router = useRouter()
const locale = useLocaleStore()
const home = useHomeStore()
const pass = usePassStore()
const { haptic } = useTelegram()

onMounted(() => {
  void pass.ensureLoaded()
  void home.loadActivity()
})

const balanceLabel = computed(() =>
  pass.walletEnabled
    ? fmtSom(pass.balanceSom, passStrings(locale.locale).unit)
    : locale.t.agentHome.tabs.balance,
)

const tabs = computed(() => [
  { key: 'orders', to: ROUTES.agentHome, match: [ROUTES.agentHome, ROUTES.liveOrders], label: locale.t.agentHome.tabs.orders, icon: Rows2, badge: 0 },
  { key: 'chats', to: ROUTES.agentChats, match: [ROUTES.agentChats, '/chat'], label: locale.t.agentHome.tabs.chats, icon: MessageCircleMore, badge: home.unreadChats },
  { key: 'balance', to: ROUTES.agentBalance, match: [ROUTES.agentBalance, ROUTES.propuskPay, ROUTES.earnings], label: balanceLabel.value, icon: Wallet, badge: 0 },
  { key: 'profile', to: ROUTES.agentProfile, match: [ROUTES.agentProfile, ROUTES.profile], label: locale.t.agentHome.tabs.profile, icon: UserRound, badge: 0 },
  { key: 'help', to: ROUTES.agentHelp, match: [ROUTES.agentHelp], label: locale.t.agentHome.tabs.help, icon: CircleHelp, badge: 0 },
])

function isActive(match: string[]): boolean {
  const path = route.path
  // `/agent` would otherwise also claim `/agent/help`.
  return match.some(m => path === m || (m !== ROUTES.agentHome && path.startsWith(`${m}/`)))
}

function go(to: string, active: boolean) {
  if (active) return
  haptic('light')
  void router.push(to)
}
</script>

<template>
  <nav
    class="atb"
    :aria-label="locale.t.agentHome.modeAgent"
  >
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="atb__tab"
      :class="{ 'is-on': isActive(tab.match) }"
      :aria-current="isActive(tab.match) ? 'page' : undefined"
      @click="go(tab.to, isActive(tab.match))"
    >
      <span class="atb__ic">
        <component
          :is="tab.icon"
          class="size-[23px]"
          :stroke-width="isActive(tab.match) ? 2.4 : 1.9"
          :fill="isActive(tab.match) ? 'currentColor' : 'none'"
          :fill-opacity="isActive(tab.match) ? 0.14 : 0"
        />
        <span
          v-if="tab.badge > 0 && !isActive(tab.match)"
          class="atb__badge"
        >{{ tab.badge > 99 ? '99+' : tab.badge }}</span>
      </span>
      <span class="atb__lbl">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.atb {
  position: fixed; inset-inline: 0; bottom: 0; z-index: 40;
  display: grid; grid-template-columns: repeat(5, 1fr); align-items: center;
  padding: 6px 4px max(env(safe-area-inset-bottom), 8px);
  background: var(--card); border-top: 1px solid var(--border);
}
.atb__tab {
  display: flex; flex-direction: column; align-items: center; gap: 2px; min-height: 44px; padding: 0;
  border: 0; background: none; color: var(--muted-foreground); font-family: inherit; font-size: 10.5px; font-weight: 500; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.atb__tab.is-on { color: var(--foreground); font-weight: 700; }
.atb__tab:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 12px; }
.atb__ic { position: relative; display: grid; place-items: center; }
.atb__badge {
  position: absolute; top: -5px; left: 14px; min-width: 16px; height: 16px; padding: 0 4px; box-sizing: border-box;
  border-radius: 999px; background: #e5484d; color: #fff; font-size: 10px; font-weight: 700; line-height: 16px; text-align: center;
}
.atb__lbl { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
