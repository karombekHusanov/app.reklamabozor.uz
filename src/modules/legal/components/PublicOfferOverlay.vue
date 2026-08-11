<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import PublicOfferDocument from './PublicOfferDocument.vue'

const emit = defineEmits<{
  close: []
}>()

const locale = useLocaleStore()
</script>

<template>
  <div class="tahoe-bg fixed inset-0 z-[100] flex flex-col overflow-y-auto">
    <div class="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-6">
      <button
        type="button"
        class="pressable -ml-2 flex h-10 w-fit items-center gap-0.5 rounded-full pr-3 text-sm font-medium text-foreground"
        @click="emit('close')"
      >
        <ChevronLeft class="size-5" />
        {{ locale.t.common.back }}
      </button>

      <div class="mt-6">
        <p class="text-xs font-medium text-muted-foreground">
          {{ locale.t.legal.offerVersionLabel }}
        </p>
        <h1 class="mt-1 text-xl font-bold tracking-tight text-foreground">
          {{ locale.t.legal.offerTitle }}
        </h1>
      </div>

      <div class="mt-6 pb-8">
        <PublicOfferDocument />
      </div>
    </div>
  </div>
</template>
