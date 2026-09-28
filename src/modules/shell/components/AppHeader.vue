<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref, useSlots } from 'vue'
import { useRouter } from 'vue-router'
import type { HTMLAttributes } from 'vue'
import WebApp from '@twa-dev/sdk'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { navigateBack } from '@/core/lib/navigation'
import { isInsideTelegram, supportsVersion } from '@/core/lib/telegram-init'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  /** Optional when a custom `#heading` slot is provided. */
  title?: string
  subtitle?: string
  /** Show a back affordance (sub-pages). Uses Telegram's native BackButton when available. */
  showBack?: boolean
  /** Pin `#trailing` to the card's right edge (illustration overlays, text stays in flow). */
  trailingOverlay?: boolean
  /**
   * Full-width flat bar (messenger-style) instead of the floating glass card.
   * `#below` renders under it, pinned with the header (e.g. an action strip).
   */
  flat?: boolean
}>(), {
  showBack: false,
  title: undefined,
  subtitle: undefined,
  trailingOverlay: false,
  flat: false,
})

// A flat header's height depends on its `#below` content — keep the spacer in sync.
const slots = useSlots()
const flatDock = ref<HTMLElement | null>(null)
const flatHeight = ref(0)
let flatObserver: ResizeObserver | null = null

onMounted(() => {
  if (!props.flat || !flatDock.value || typeof ResizeObserver === 'undefined') return
  flatObserver = new ResizeObserver(([entry]) => {
    flatHeight.value = entry.target.getBoundingClientRect().height
  })
  flatObserver.observe(flatDock.value)
})

onBeforeUnmount(() => flatObserver?.disconnect())

const locale = useLocaleStore()
const router = useRouter()

function goBack() {
  navigateBack(router)
}

// Also wire Telegram's native BackButton when available — but keep the in-page
// chevron visible. After expand(), many clients hide or relocate the native
// control, so relying on it alone leaves prod users with no back affordance.
const nativeBackActive = ref(false)

onMounted(() => {
  if (!props.showBack || !isInsideTelegram() || !supportsVersion('6.1')) return
  try {
    WebApp.BackButton.onClick(goBack)
    WebApp.BackButton.show()
    nativeBackActive.value = true
  }
  catch {
    nativeBackActive.value = false
  }
})

onBeforeUnmount(() => {
  if (!nativeBackActive.value) return
  try {
    WebApp.BackButton.offClick(goBack)
    WebApp.BackButton.hide()
  }
  catch {
    // ignore — old client
  }
})
</script>

<template>
  <div
    v-if="flat"
    :class="props.class"
  >
    <div
      ref="flatDock"
      class="app-header-flat"
    >
      <div class="app-header-flat__row">
        <button
          v-if="showBack"
          type="button"
          class="app-header-flat__back pressable"
          :aria-label="locale.t.common.back"
          @click="goBack"
        >
          <ChevronLeft class="size-5" />
        </button>
        <div class="min-w-0 flex-1 overflow-hidden">
          <slot name="heading">
            <h1 class="rb-font-display truncate text-[18px] font-bold leading-tight text-foreground">
              {{ title }}
            </h1>
          </slot>
        </div>
        <div
          v-if="slots.trailing"
          class="shrink-0"
        >
          <slot name="trailing" />
        </div>
      </div>
      <slot name="below" />
    </div>
    <div
      class="app-header-flat__spacer"
      :style="flatHeight ? { height: `${flatHeight}px` } : undefined"
      aria-hidden="true"
    />
  </div>

  <div
    v-else
    class="app-header-wrap"
    :class="props.class"
  >
    <div class="app-header-dock">
      <GlassCard
        frosted
        padding="xs"
        class="app-header-card"
        :class="trailingOverlay && $slots.trailing ? 'app-header-card--art !overflow-visible' : ''"
      >
        <div
          class="flex min-h-10 items-center gap-2.5 pl-2.5 pr-1"
          :class="trailingOverlay && $slots.trailing ? 'pr-16' : ''"
        >
          <button
            v-if="showBack"
            type="button"
            class="app-header-back pressable"
            :aria-label="locale.t.common.back"
            @click="goBack"
          >
            <ChevronLeft class="size-5" />
          </button>

          <div class="min-w-0 flex-1">
            <slot name="heading">
              <div class="min-w-0">
                <p
                  v-if="subtitle"
                  class="truncate text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
                >
                  {{ subtitle }}
                </p>
                <h1
                  class="rb-font-display truncate text-[18px] font-bold leading-tight tracking-[-0.01em] text-foreground"
                  :class="subtitle && 'mt-0.5'"
                >
                  {{ title }}
                </h1>
              </div>
            </slot>
          </div>

          <div
            v-if="$slots.trailing"
            :class="trailingOverlay
              ? 'pointer-events-none absolute top-1/2 -right-1.5 z-10 -translate-y-1/2'
              : 'shrink-0'"
          >
            <slot name="trailing" />
          </div>
        </div>
      </GlassCard>
    </div>
    <div
      class="app-header-spacer"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.app-header-flat {
  position: fixed;
  inset: 0 0 auto;
  z-index: 40;
  padding-top: max(env(safe-area-inset-top), 0.5rem);
  border-bottom: 1px solid var(--border);
  background: var(--card);
}
.app-header-flat__row { display: flex; min-height: 52px; align-items: center; gap: 4px; padding: 4px 8px 4px 2px; }
.app-header-flat__back {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: none;
  color: var(--foreground);
  cursor: pointer;
}
.app-header-flat__back:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
/* Fallback until the observer measures the real height. */
.app-header-flat__spacer { height: calc(max(env(safe-area-inset-top), 0.5rem) + 61px); }
</style>
