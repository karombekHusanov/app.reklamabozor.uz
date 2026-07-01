<script setup lang="ts">
import { Check, Languages } from '@lucide/vue'
import { ref } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { LOCALES, type Locale } from '@/core/i18n/messages'
import { useTelegram } from '@/core/composables/useTelegram'

const locale = useLocaleStore()
const { haptic } = useTelegram()

const open = ref(false)

function pick(value: Locale) {
  haptic('light')
  locale.setLocale(value)
  open.value = false
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-sm font-semibold text-white transition active:scale-95"
      :aria-label="locale.t.shell.language"
      @click="open = !open"
    >
      <Languages class="size-4" />
      <span class="uppercase">{{ locale.locale }}</span>
    </button>

    <!-- Click-away backdrop -->
    <button
      v-if="open"
      type="button"
      class="fixed inset-0 z-40 cursor-default"
      aria-label="Close"
      @click="open = false"
    />

    <!-- Menu -->
    <div
      v-if="open"
      class="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-card p-1 shadow-xl"
    >
      <button
        v-for="lang in LOCALES"
        :key="lang.value"
        type="button"
        class="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
        :class="locale.locale === lang.value ? 'bg-muted font-semibold' : ''"
        @click="pick(lang.value)"
      >
        {{ lang.label }}
        <Check v-if="locale.locale === lang.value" class="size-4 shrink-0 text-primary" />
      </button>
    </div>
  </div>
</template>
