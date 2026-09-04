<script setup lang="ts">
import { Loader2, Plus, Trash2 } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatPrice } from '@/modules/orders/lib/order-status'
import { maskMoneyInput } from '@/core/lib/money'
import { MAX_PRICELIST_ITEMS } from '@/modules/orders/types/order'
import type { OfferItem, PricelistItemInput } from '@/modules/orders/types/order'

const props = defineProps<{
  initialItems?: OfferItem[]
  initialDeadlineDays?: number | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { items: PricelistItemInput[], deadlineDays: number }]
}>()

const locale = useLocaleStore()

interface Row {
  name: string
  unit: string
  qty: number
  qtyDisplay: string
  price: number
  priceDisplay: string
}

function emptyRow(): Row {
  return { name: '', unit: locale.t.orders.pricelist.unit, qty: 1, qtyDisplay: '1', price: 0, priceDisplay: '' }
}

const rows = ref<Row[]>([emptyRow()])

const deadlineDays = ref<number | null>(props.initialDeadlineDays ?? null)
const deadlineDisplay = ref(props.initialDeadlineDays ? String(props.initialDeadlineDays) : '')

watch(() => props.initialDeadlineDays, (v) => {
  deadlineDays.value = v ?? null
  deadlineDisplay.value = v ? String(v) : ''
})

function onDeadlineInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value.replace(/[^\d]/g, '')
  deadlineDisplay.value = raw
  const n = Number(raw)
  deadlineDays.value = Number.isFinite(n) && n > 0 ? n : null
}

function seedFromItems() {
  if (props.initialItems?.length) {
    rows.value = props.initialItems.map((it) => {
      const price = Math.round(Number(it.unit_price))
      const qty = Number(it.quantity)
      return {
        name: it.name,
        unit: it.unit,
        qty,
        qtyDisplay: Number.isInteger(qty) ? String(qty) : String(qty),
        price,
        priceDisplay: maskMoneyInput(String(price)).display,
      }
    })
  }
  else {
    rows.value = [emptyRow()]
  }
}

watch(() => props.initialItems, seedFromItems, { immediate: true })

function addRow() {
  if (rows.value.length >= MAX_PRICELIST_ITEMS) return
  rows.value.push(emptyRow())
}

function removeRow(index: number) {
  rows.value.splice(index, 1)
  if (rows.value.length === 0) rows.value.push(emptyRow())
}

function onQtyInput(row: Row, event: Event) {
  const raw = (event.target as HTMLInputElement).value.replace(/[^\d.]/g, '')
  row.qtyDisplay = raw
  const n = Number(raw)
  row.qty = Number.isFinite(n) ? n : 0
}

function onPriceInput(row: Row, event: Event) {
  const { amount, display } = maskMoneyInput((event.target as HTMLInputElement).value)
  row.price = amount
  row.priceDisplay = display
  ;(event.target as HTMLInputElement).value = display
}

function lineTotal(row: Row): number {
  return row.qty * row.price
}

const validRows = computed(() =>
  rows.value.filter(r => r.name.trim() !== '' && r.qty > 0 && r.price >= 0),
)

const total = computed(() => validRows.value.reduce((s, r) => s + lineTotal(r), 0))

const canSubmit = computed(() =>
  validRows.value.length > 0 && !!deadlineDays.value && deadlineDays.value > 0 && !props.submitting,
)

function submit() {
  if (!canSubmit.value || !deadlineDays.value) return
  emit('submit', {
    items: validRows.value.map<PricelistItemInput>(r => ({
      name: r.name.trim(),
      unit: r.unit.trim() || locale.t.orders.pricelist.unit,
      quantity: r.qty,
      unit_price: r.price,
    })),
    deadlineDays: deadlineDays.value,
  })
}
</script>

<template>
  <div class="space-y-4 pb-4">
    <p class="rounded-2xl bg-muted/50 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground dark:bg-white/5">
      {{ locale.t.agent.pricelistHint }}
    </p>

    <div class="space-y-3">
      <div
        v-for="(row, index) in rows"
        :key="index"
        class="glass-field space-y-2.5 rounded-2xl p-3"
      >
        <div class="flex items-center gap-2">
          <input
            v-model="row.name"
            type="text"
            :placeholder="locale.t.agent.pricelistNamePlaceholder"
            class="glass-input flex-1 text-sm"
          >
          <button
            type="button"
            class="pressable grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:text-destructive"
            :aria-label="locale.t.agent.pricelistAddItem"
            @click="removeRow(index)"
          >
            <Trash2 class="size-4" />
          </button>
        </div>

        <div class="grid grid-cols-[1fr_1fr_1.3fr] gap-2">
          <input
            :value="row.qtyDisplay"
            type="text"
            inputmode="decimal"
            :placeholder="locale.t.agent.pricelistQtyPlaceholder"
            class="glass-input text-sm tabular-nums"
            @input="onQtyInput(row, $event)"
          >
          <input
            v-model="row.unit"
            type="text"
            :placeholder="locale.t.agent.pricelistUnitPlaceholder"
            class="glass-input text-sm"
          >
          <input
            :value="row.priceDisplay"
            type="text"
            inputmode="numeric"
            :placeholder="locale.t.agent.pricelistPricePlaceholder"
            class="glass-input text-sm tabular-nums"
            @input="onPriceInput(row, $event)"
          >
        </div>

        <p
          v-if="row.qty > 0 && row.price > 0"
          class="text-right text-[11px] font-medium tabular-nums text-muted-foreground"
        >
          {{ locale.t.orders.pricelist.lineTotal }}: {{ formatPrice(lineTotal(row)) }}
        </p>
      </div>
    </div>

    <Button
      v-if="rows.length < MAX_PRICELIST_ITEMS"
      variant="outline"
      class="h-10 w-full rounded-2xl text-sm font-semibold"
      @click="addRow"
    >
      <Plus class="size-4" />
      {{ locale.t.agent.pricelistAddItem }}
    </Button>

    <div class="glass-field space-y-2 rounded-2xl p-3">
      <label class="text-xs font-semibold text-foreground">
        {{ locale.t.agent.pricelistDeadlineLabel }}
      </label>
      <div class="flex items-center gap-2">
        <input
          :value="deadlineDisplay"
          type="text"
          inputmode="numeric"
          :placeholder="locale.t.agent.pricelistDeadlinePlaceholder"
          class="glass-input w-24 text-sm tabular-nums"
          @input="onDeadlineInput"
        >
        <span class="text-sm text-muted-foreground">{{ locale.t.agent.pricelistDeadlineUnit }}</span>
      </div>
      <p class="text-[11px] leading-relaxed text-muted-foreground">
        {{ locale.t.agent.pricelistDeadlineHint }}
      </p>
    </div>

    <div class="flex items-center justify-between gap-3 rounded-2xl bg-primary/10 px-4 py-3">
      <span class="text-sm font-semibold text-foreground">
        {{ locale.t.orders.pricelist.total }}
      </span>
      <span class="text-lg font-bold tabular-nums text-primary">
        {{ formatPrice(total) }}
      </span>
    </div>

    <p
      v-if="validRows.length === 0"
      class="text-center text-[11px] font-medium text-amber-600 dark:text-amber-400"
    >
      {{ locale.t.agent.pricelistNeedItem }}
    </p>

    <Button
      class="btn-brand h-12 w-full rounded-2xl text-base font-semibold"
      :disabled="!canSubmit"
      @click="submit"
    >
      <Loader2
        v-if="submitting"
        class="size-4 animate-spin"
      />
      {{ locale.t.agent.pricelistSave }}
    </Button>
  </div>
</template>
