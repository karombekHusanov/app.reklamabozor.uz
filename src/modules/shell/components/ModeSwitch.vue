<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import { useModeStore, type AppMode } from '@/modules/shell/stores/mode.store'

/**
 * Client | Agent pill for the dark top bars. A white thumb slides to the
 * chosen side first, then the workspace changes (the page transition takes
 * over from there). `badge` marks news on the other side.
 */
const props = defineProps<{ badge?: number }>()

/** Long enough for the thumb to land before the page starts to fade. */
const SLIDE_MS = 220

const mode = useModeStore()
const router = useRouter()
const locale = useLocaleStore()
const { haptic } = useTelegram()

const current = computed<AppMode>(() => (mode.isAgent ? 'agent' : 'client'))
const selected = ref<AppMode>(current.value)
watch(current, (value) => { selected.value = value })

const options = computed(() => [
  { value: 'client' as const, label: locale.t.agentHome.modeClient, to: ROUTES.home },
  { value: 'agent' as const, label: locale.t.agentHome.modeAgent, to: ROUTES.agentHome },
])

let timer: ReturnType<typeof setTimeout> | null = null

function pick(value: AppMode, to: string) {
  if (value === selected.value) return
  haptic('light')
  // No provider profile yet → "Agent" opens the agency application instead of a workspace.
  if (value === 'agent' && !mode.canUseAgent) {
    void router.push(`${ROUTES.profileEdit}?as=agent`)
    return
  }
  selected.value = value
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    mode.set(value)
    void router.replace(to)
  }, SLIDE_MS)
}

onBeforeUnmount(() => { if (timer) clearTimeout(timer) })
</script>

<template>
  <nav
    class="mode-switch"
    :aria-label="locale.t.agentHome.modeLabel"
  >
    <span
      class="mode-switch__thumb"
      :class="{ 'is-right': selected === 'agent' }"
      aria-hidden="true"
    />
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="mode-switch__btn"
      :class="{ 'is-on': opt.value === selected }"
      :aria-current="opt.value === selected ? 'page' : undefined"
      @click="pick(opt.value, opt.to)"
    >
      <span
        class="mode-switch__dot"
        :class="[`mode-switch__dot--${opt.value}`, { 'is-shown': opt.value === selected }]"
        aria-hidden="true"
      />
      {{ opt.label }}
      <span
        v-if="opt.value !== selected && props.badge"
        class="mode-switch__badge"
      >{{ props.badge > 99 ? '99+' : props.badge }}</span>
    </button>
  </nav>
</template>

<style scoped>
.mode-switch {
  position: relative; display: flex; flex: 1; min-width: 0; gap: 4px; padding: 4px;
  border-radius: var(--rb-r-chip); border: 1px solid rgba(255, 255, 255, 0.16); background: rgba(255, 255, 255, 0.12);
}
.mode-switch__thumb {
  position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 6px);
  border-radius: var(--rb-r-chip); background: #fff; box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.35);
  transition: transform var(--rb-dur-slow) var(--rb-ease);
}
.mode-switch__thumb.is-right { transform: translateX(calc(100% + 4px)); }
.mode-switch__btn {
  position: relative; z-index: 1;
  display: inline-flex; flex: 1; align-items: center; justify-content: center; gap: 5px; min-height: 34px;
  border: 0; border-radius: var(--rb-r-chip); background: transparent;
  color: rgba(255, 255, 255, 0.9); font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: color var(--rb-dur-slow) var(--rb-ease);
  -webkit-tap-highlight-color: transparent;
}
.mode-switch__btn.is-on { color: #02305c; font-weight: 700; }
.mode-switch__btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.mode-switch__dot { width: 0; height: 8px; border-radius: 999px; opacity: 0; transition: width var(--rb-dur) var(--rb-ease), opacity var(--rb-dur) var(--rb-ease); }
.mode-switch__dot.is-shown { width: 8px; opacity: 1; }
.mode-switch__dot--client { background: var(--rb-cta); }
.mode-switch__dot--agent { background: var(--rb-glow); }
.mode-switch__badge {
  min-width: 16px; height: 16px; padding: 0 4px; box-sizing: border-box; border-radius: 999px;
  background: var(--rb-cta); color: #fff; font-size: 10px; font-weight: 700; line-height: 16px; text-align: center;
}
@media (prefers-reduced-motion: reduce) {
  .mode-switch__thumb, .mode-switch__btn, .mode-switch__dot { transition: none; }
}
</style>
