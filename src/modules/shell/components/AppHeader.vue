<script setup lang="ts">
import { Bell, ChevronLeft } from '@lucide/vue'
import { useRouter } from 'vue-router'
import type { HTMLAttributes } from 'vue'
import LanguageSwitcher from '@/core/ui/LanguageSwitcher.vue'

withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  title: string
  subtitle?: string
  /** Show a back chevron (sub-pages). */
  showBack?: boolean
}>(), {
  showBack: false,
})

const router = useRouter()
</script>

<template>
  <header class="safe-top px-5 pb-4 pt-3 text-white">
    <!-- Top control row -->
    <div class="flex items-center justify-between">
      <button
        v-if="showBack"
        type="button"
        class="-ml-1 flex size-9 items-center justify-center rounded-xl text-white transition active:scale-95"
        @click="router.back()"
      >
        <ChevronLeft class="size-6" />
      </button>
      <span v-else />

      <div class="flex items-center gap-2">
        <LanguageSwitcher />
        <button
          type="button"
          class="relative flex size-9 items-center justify-center rounded-full bg-white/15 transition active:scale-95"
        >
          <Bell class="size-4.5" />
          <span class="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-[#02305C]" />
        </button>
      </div>
    </div>

    <!-- Title -->
    <div class="mt-2 space-y-0.5">
      <p v-if="subtitle" class="text-sm text-white/70">
        {{ subtitle }}
      </p>
      <h1 class="text-2xl font-bold tracking-tight text-white">
        {{ title }}
      </h1>
    </div>
  </header>
</template>
