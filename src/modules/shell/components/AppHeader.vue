<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { HTMLAttributes } from 'vue'
import WebApp from '@twa-dev/sdk'
import LanguageSwitcher from '@/core/ui/LanguageSwitcher.vue'
import { isInsideTelegram, supportsVersion } from '@/core/lib/telegram-init'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  title: string
  subtitle?: string
  /** Show a back affordance (sub-pages). Uses Telegram's native BackButton when available. */
  showBack?: boolean
}>(), {
  showBack: false,
})

const router = useRouter()

function goBack() {
  router.back()
}

// Prefer Telegram's native BackButton (rendered in the Telegram header itself) over
// an in-page chevron — the strongest "real app" affordance available to a mini app.
const usingNativeBack = ref(false)

onMounted(() => {
  if (!props.showBack || !isInsideTelegram() || !supportsVersion('6.1')) return
  try {
    WebApp.BackButton.onClick(goBack)
    WebApp.BackButton.show()
    usingNativeBack.value = true
  }
  catch {
    usingNativeBack.value = false
  }
})

onBeforeUnmount(() => {
  if (!usingNativeBack.value) return
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
  <header class="safe-top px-5 pb-4 pt-3">
    <!-- Top control row -->
    <div class="flex items-center justify-between">
      <button
        v-if="showBack && !usingNativeBack"
        type="button"
        class="-ml-1 flex size-9 items-center justify-center rounded-xl text-foreground transition active:scale-95"
        @click="goBack"
      >
        <ChevronLeft class="size-6" />
      </button>
      <span v-else />

      <LanguageSwitcher />
    </div>

    <!-- Title -->
    <div class="mt-2 space-y-0.5">
      <p v-if="subtitle" class="text-sm text-muted-foreground">
        {{ subtitle }}
      </p>
      <h1 class="text-2xl font-bold tracking-tight text-foreground">
        {{ title }}
      </h1>
    </div>
  </header>
</template>
