<script setup lang="ts">
import { Download, FileText } from '@lucide/vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import ProtectedFileLink from '@/core/ui/ProtectedFileLink.vue'
import { formatPrice } from '@/modules/orders/lib/order-status'
import type { OrderContract } from '@/modules/orders/types/order'

defineProps<{ contract: OrderContract }>()

const locale = useLocaleStore()
</script>

<template>
  <GlassCard class="space-y-3">
    <div class="flex items-center gap-3">
      <div class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
        <FileText class="size-6" />
      </div>
      <div class="min-w-0">
        <h3 class="truncate text-base font-semibold leading-tight">
          {{ locale.t.orders.contract.title }}
        </h3>
        <p class="mt-0.5 text-[13px] text-muted-foreground">
          № {{ contract.number }} · {{ formatPrice(contract.total) }}
        </p>
      </div>
    </div>

    <ProtectedFileLink
      v-if="contract.pdf_url"
      :href="contract.pdf_url"
      :name="`contract-${contract.number}`"
      class="pressable flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary"
    >
      <Download class="size-4" />
      {{ locale.t.orders.contract.download }}
    </ProtectedFileLink>
  </GlassCard>
</template>
