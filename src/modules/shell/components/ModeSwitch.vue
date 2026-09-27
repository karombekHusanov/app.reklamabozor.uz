<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import { useModeStore, type AppMode } from '@/modules/shell/stores/mode.store'

/** Client | Agent pill for the dark top bars. `badge` marks news on the other side. */
const props = defineProps<{ badge?: number }>()

const mode = useModeStore()
const router = useRouter()
const locale = useLocaleStore()
const { haptic } = useTelegram()

const current = computed<AppMode>(() => (mode.isAgent ? 'agent' : 'client'))

const options = computed(() => [
  { value: 'client' as const, label: locale.t.agentHome.modeClient, to: ROUTES.home },
  { value: 'agent' as const, label: locale.t.agentHome.modeAgent, to: ROUTES.agentHome },
])

function pick(value: AppMode, to: string) {
  if (value === current.value) return
  haptic('light')
  mode.set(value)
  void router.replace(to)
}
</script>

<template>
  <nav
    class="mode-switch"
    :aria-label="locale.t.agentHome.modeLabel"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="mode-switch__btn"
      :class="{ 'is-on': opt.value === current }"
      :aria-current="opt.value === current ? 'page' : undefined"
      @click="pick(opt.value, opt.to)"
    >
      <span
        v-if="opt.value === current"
        class="mode-switch__dot"
        :class="`mode-switch__dot--${opt.value}`"
        aria-hidden="true"
      />
      {{ opt.label }}
      <span
        v-if="opt.value !== current && props.badge"
        class="mode-switch__badge"
      >{{ props.badge > 99 ? '99+' : props.badge }}</span>
    </button>
  </nav>
</template>

<style scoped>
.mode-switch {
  display: flex; flex: 1; min-width: 0; gap: 4px; padding: 4px;
  border-radius: var(--rb-r-chip); border: 1px solid rgba(255, 255, 255, 0.16); background: rgba(255, 255, 255, 0.12);
}
.mode-switch__btn {
  display: inline-flex; flex: 1; align-items: center; justify-content: center; gap: 5px; min-height: 34px;
  border: 0; border-radius: var(--rb-r-chip); background: transparent;
  color: rgba(255, 255, 255, 0.9); font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background var(--rb-dur) var(--rb-ease), color var(--rb-dur) var(--rb-ease);
  -webkit-tap-highlight-color: transparent;
}
.mode-switch__btn.is-on { background: #fff; color: #02305c; font-weight: 700; }
.mode-switch__btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.mode-switch__dot { width: 8px; height: 8px; border-radius: 999px; }
.mode-switch__dot--client { background: var(--rb-cta); }
.mode-switch__dot--agent { background: var(--rb-glow); }
.mode-switch__badge {
  min-width: 16px; height: 16px; padding: 0 4px; box-sizing: border-box; border-radius: 999px;
  background: var(--rb-cta); color: #fff; font-size: 10px; font-weight: 700; line-height: 16px; text-align: center;
}
</style>
