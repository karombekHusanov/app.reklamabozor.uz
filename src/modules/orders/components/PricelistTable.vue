<script setup lang="ts">
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatPrice } from '@/modules/orders/lib/order-status'
import type { OfferItem } from '@/modules/orders/types/order'

const props = defineProps<{
  items: OfferItem[]
  /** Grand total; falls back to summing the lines when omitted. */
  total?: string | number | null
}>()

const locale = useLocaleStore()

function toNum(v: string | number | null | undefined): number {
  const n = typeof v === 'string' ? Number(v) : (v ?? 0)
  return Number.isNaN(n) ? 0 : n
}

/** Trim trailing zeros from quantity (2.000 → 2, 1.500 → 1.5). */
function fmtQty(v: string | number): string {
  const n = toNum(v)
  return Number.isInteger(n) ? String(n) : String(n).replace(/\.?0+$/, '')
}

const grandTotal = computed(() => {
  if (props.total != null && props.total !== '') return toNum(props.total)
  return props.items.reduce((sum, it) => sum + toNum(it.line_total), 0)
})
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-border/70">
    <div class="grid grid-cols-[1fr_auto] gap-x-3 bg-muted/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground dark:bg-white/5">
      <span>{{ locale.t.orders.pricelist.item }}</span>
      <span class="text-right">{{ locale.t.orders.pricelist.lineTotal }}</span>
    </div>

    <ul class="divide-y divide-border/60">
      <li
        v-for="item in items"
        :key="item.id"
        class="grid grid-cols-[1fr_auto] gap-x-3 px-3 py-2.5"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-foreground">
            {{ item.name }}
          </p>
          <p class="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
            {{ fmtQty(item.quantity) }} {{ item.unit }} × {{ formatPrice(item.unit_price) }}
          </p>
        </div>
        <p class="self-center text-right text-sm font-semibold tabular-nums text-foreground">
          {{ formatPrice(item.line_total) }}
        </p>
      </li>
    </ul>

    <div class="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/40 px-3 py-2.5 dark:bg-white/5">
      <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {{ locale.t.orders.pricelist.total }}
      </span>
      <span class="text-base font-bold tabular-nums text-primary">
        {{ formatPrice(grandTotal) }}
      </span>
    </div>
  </div>
</template>
