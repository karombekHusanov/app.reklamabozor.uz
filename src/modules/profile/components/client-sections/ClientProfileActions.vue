<script setup lang="ts">
import { ClipboardList, Plus } from '@lucide/vue'
import { ROUTES } from '@/modules/shell/constants/routes'

defineProps<{
  locale: any
}>()

const emit = defineEmits<{
  navigate: [to: string]
}>()
</script>

<template>
  <div class="flex items-stretch gap-2">
      <button
        type="button"
        class="agent-profile-order-btn pressable flex flex-1 flex-col items-start justify-center gap-0.5 rounded-[14px] px-2.5 py-1.5 text-left"
        @click="emit('navigate', ROUTES.newOrder)"
      >
        <span class="inline-flex items-center gap-1.5 text-[13px] font-bold leading-none text-white">
          <Plus class="size-3.5 shrink-0" />
          {{ locale.t.profile.clientOrderCta }}
        </span>
        <span class="text-[9px] font-medium leading-snug text-white/88">
          {{ locale.t.profile.clientOrderHint }}
        </span>
      </button>

      <button
        type="button"
        class="agent-profile-chat-btn pressable flex shrink-0 items-center gap-2 px-2.5 py-1.5"
        @click="emit('navigate', ROUTES.orders)"
      >
        <span class="agent-profile-stat__icon !size-7 shrink-0">
          <ClipboardList class="size-3.5" />
        </span>
        <span class="max-w-[4.5rem] text-left text-[9px] font-semibold leading-tight text-foreground">
          {{ locale.t.profile.clientOrdersCta }}
        </span>
      </button>
  </div>
</template>
