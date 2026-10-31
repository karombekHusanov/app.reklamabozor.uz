<script setup lang="ts">
import { MonitorPlay } from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { OrderPlacement } from '@/modules/placements/types/placement'

/**
 * The screens an order was built from — one row per placement, in the order
 * the client picked them. Shared by the client's order page, the agent's offer
 * page, the showcase detail and the form review.
 */
withDefaults(defineProps<{
  placements: OrderPlacement[]
  /** No card chrome — rows only (inside another card). */
  bare?: boolean
}>(), { bare: false })

const locale = useLocaleStore()
const t = computed(() => locale.t.placements)
</script>

<template>
  <section
    class="opc"
    :class="{ 'opc--bare': bare }"
  >
    <header class="opc__head">
      <MonitorPlay class="size-[18px] shrink-0 text-primary" />
      <h3 class="opc__title">
        {{ t.orderCardTitle }}
      </h3>
      <span class="opc__count">{{ t.screensCount.replace('{n}', String(placements.length)) }}</span>
    </header>
    <ol class="opc__list">
      <li
        v-for="(item, index) in placements"
        :key="item.id"
        class="opc__row"
      >
        <span class="opc__n">{{ index + 1 }}</span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-semibold text-foreground">{{ item.address }}</span>
          <span class="block truncate text-xs text-muted-foreground">
            {{ item.owner_name }}<template v-if="item.quantity && item.unit"> · {{ item.quantity }} {{ item.unit }}</template>
          </span>
        </span>
        <span
          v-if="item.estimated_price_som"
          class="shrink-0 text-xs font-bold tabular-nums text-foreground"
        >{{ item.estimated_price_som.toLocaleString('uz-UZ') }}</span>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.opc { border-radius: var(--rb-r-card); background: var(--card); box-shadow: var(--rb-elev-1); padding: 12px 16px; }
.opc--bare { border-radius: 0; background: transparent; box-shadow: none; padding: 0; }
.opc__head { display: flex; align-items: center; gap: 8px; min-height: 28px; }
.opc__title { flex: 1; font-size: 14px; font-weight: 700; color: var(--foreground); }
.opc__count { font-size: 12px; font-weight: 600; color: var(--muted-foreground); }
.opc__list { margin-top: 6px; }
.opc__row { display: flex; align-items: center; gap: 10px; min-height: 48px; }
.opc__row + .opc__row { border-top: 1px solid var(--border); }
.opc__n { display: grid; place-items: center; width: 24px; height: 24px; flex-shrink: 0; border-radius: 9999px; background: color-mix(in oklab, var(--primary) 12%, transparent); font-size: 11px; font-weight: 700; color: var(--primary); }
</style>
