<script setup lang="ts">
import { Download, FileCheck2 } from '@lucide/vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatPrice } from '@/modules/orders/lib/order-status'
import type { OrderDocument } from '@/modules/orders/types/order'

/**
 * The acts that close a finished deal, for the accountant on either side: the
 * act of completed work, and (for the agent) the platform's commission act.
 */
defineProps<{ documents: OrderDocument[] }>()

const locale = useLocaleStore()
</script>

<template>
  <GlassCard
    v-if="documents.length"
    class="space-y-3"
  >
    <div class="flex items-center gap-3">
      <div class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
        <FileCheck2 class="size-6" />
      </div>
      <div class="min-w-0">
        <h3 class="truncate text-base font-semibold leading-tight">
          {{ locale.t.orders.acts.title }}
        </h3>
        <p class="mt-0.5 text-[13px] text-muted-foreground">
          {{ locale.t.orders.acts.hint }}
        </p>
      </div>
    </div>

    <a
      v-for="document in documents"
      :key="document.id"
      :href="document.pdf_url ?? undefined"
      target="_blank"
      rel="noopener"
      class="pressable flex items-center gap-3 rounded-2xl border border-border/70 px-3.5 py-3"
    >
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-semibold text-foreground">
          {{ locale.t.orders.acts.types[document.type] ?? document.title }}
        </span>
        <span class="mt-0.5 block truncate text-[11px] text-muted-foreground">
          № {{ document.number }} · {{ formatPrice(document.total) }}
        </span>
      </span>
      <Download class="size-4 shrink-0 text-primary" />
    </a>
  </GlassCard>
</template>
