<script setup lang="ts">
import { Check, Languages } from '@lucide/vue'
import { ref } from 'vue'
import Drawer from '@/core/ui/Drawer.vue'
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
  <div>
    <button
      type="button"
      class="flex h-9 items-center gap-1.5 rounded-full bg-muted px-3 text-sm font-semibold text-foreground transition active:scale-95"
      :aria-label="locale.t.shell.language"
      @click="open = true"
    >
      <Languages class="size-4" />
      <span class="uppercase">{{ locale.locale }}</span>
    </button>

    <Drawer v-model:open="open" :title="locale.t.shell.language">
      <div class="space-y-1 pb-2">
        <button
          v-for="lang in LOCALES"
          :key="lang.value"
          type="button"
          class="pressable flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3.5 text-left text-base"
          :class="locale.locale === lang.value ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground'"
          @click="pick(lang.value)"
        >
          {{ lang.label }}
          <Check v-if="locale.locale === lang.value" class="size-5 shrink-0" />
        </button>
      </div>
    </Drawer>
  </div>
</template>
