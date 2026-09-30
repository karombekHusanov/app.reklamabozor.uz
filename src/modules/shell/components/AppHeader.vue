<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { HTMLAttributes } from 'vue'
import WebApp from '@twa-dev/sdk'
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

const router = useRouter()

function goBack() {
  navigateBack(router)
}

// Back navigation is Telegram's native BackButton — the header draws no back control.
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
      <div
        class="app-header-card"
        :class="trailingOverlay && $slots.trailing ? 'app-header-card--art' : ''"
      >
        <div
          class="flex items-center gap-2.5"
          :class="trailingOverlay && $slots.trailing ? 'pr-16' : ''"
        >
          <div class="min-w-0 flex-1">
            <slot name="heading">
              <div class="min-w-0">
                <p
                  v-if="subtitle"
                  class="truncate text-[12.5px] font-medium text-muted-foreground"
                >
                  {{ subtitle }}
                </p>
                <h1
                  class="rb-font-display mt-0.5 truncate text-[26px] font-extrabold leading-[1.15] tracking-[-0.02em] text-foreground"
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
      </div>
    </div>
  </div>
</template>
