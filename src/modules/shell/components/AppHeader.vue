<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
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
}>(), {
  showBack: false,
  title: undefined,
  subtitle: undefined,
  trailingOverlay: false,
})

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
  <div class="app-header-wrap" :class="props.class">
    <div class="app-header-dock">
      <GlassCard
        frosted
        padding="xs"
        class="app-header-card"
        :class="trailingOverlay && $slots.trailing ? 'app-header-card--art !overflow-visible' : ''"
      >
        <div
          class="flex items-center gap-2.5"
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
                  class="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                >
                  {{ subtitle }}
                </p>
                <h1
                  class="rb-font-display truncate text-[19px] font-extrabold leading-tight tracking-[-0.02em] text-foreground"
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
