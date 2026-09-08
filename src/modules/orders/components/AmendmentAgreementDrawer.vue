<script setup lang="ts">
import { CheckCircle2, FileSignature, Loader2 } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import Drawer from '@/core/ui/Drawer.vue'
import { Button } from '@/core/ui/button'
import { Checkbox } from '@/core/ui/checkbox'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatPrice } from '@/modules/orders/lib/order-status'
import type { AmendmentDocument, AmendmentSnapshot } from '@/modules/orders/types/order'

/**
 * The addendum to the order's service contract, shown before the binding tap:
 * proposing it (the initiator's acceptance) or approving one someone sent.
 */
const props = defineProps<{
  document: AmendmentDocument | null
  /** `propose` = sending it, `approve` = answering someone else's. */
  mode: 'propose' | 'approve'
  loading?: boolean
  submitting?: boolean
  error?: string | null
}>()

const emit = defineEmits<{ accept: [] }>()

const open = defineModel<boolean>('open', { default: false })

const locale = useLocaleStore()

const consented = ref(false)

// Consent is per document: every open (and every changed text) starts unchecked.
watch(open, (isOpen) => {
  if (!isOpen) consented.value = false
})
watch(() => props.document?.hash, () => {
  consented.value = false
})

const canAccept = computed(() =>
  consented.value && !!props.document && !props.loading && !props.submitting,
)

const submitLabel = computed(() =>
  props.mode === 'propose'
    ? locale.t.amendments.drawer.sendAction
    : locale.t.amendments.drawer.approveAction,
)

const delta = computed(() => Number(props.document?.delta ?? 0))

const deltaLabel = computed(() => {
  const d = delta.value
  if (d === 0) return locale.t.amendments.drawer.deltaNone
  return `${d > 0 ? '+' : '−'}${formatPrice(Math.abs(d))}`
})

const moneyNote = computed(() => {
  if (!props.document) return null
  if (props.document.delta_direction === 'charge') return locale.t.amendments.drawer.chargeNote
  if (props.document.delta_direction === 'refund') return locale.t.amendments.drawer.refundNote
  return null
})

function side(type: string): AmendmentSnapshot | null {
  if (!props.document) return null
  return type === 'items_after' ? props.document.after : props.document.before
}

/** Trim trailing zeros: 2.000 → 2, 1.500 → 1.5 */
function fmtQty(value: string | number): string {
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return Number.isInteger(n) ? String(n) : String(n).replace(/\.?0+$/, '')
}

const partyRows = computed(() => {
  const doc = props.document
  if (!doc) return []

  const client = doc.client
  const clientName = client.is_legal_entity && client.company_name
    ? String(client.company_name)
    : String(client.name ?? '—')

  return [
    { key: 'agent', label: locale.t.amendments.drawer.partyAgent, name: doc.agent.company_name || '—' },
    { key: 'client', label: locale.t.amendments.drawer.partyClient, name: clientName },
    {
      key: 'operator',
      label: locale.t.amendments.drawer.partyOperator,
      name: String(doc.platform.legal_name ?? doc.platform.name ?? '—'),
    },
  ]
})
</script>

<template>
  <Drawer
    v-model:open="open"
    :title="locale.t.amendments.drawer.title"
  >
    <div class="space-y-4 pb-4">
      <p
        v-if="error"
        class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ error }}
      </p>

      <div
        v-else-if="loading || !document"
        class="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
      >
        <Loader2 class="size-4 animate-spin" />
        {{ locale.t.common.loading }}
      </div>

      <template v-else>
        <!-- Which contract this is an addendum to -->
        <div class="rounded-2xl bg-primary/8 px-4 py-3">
          <div class="flex items-start gap-3">
            <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
              <FileSignature class="size-5" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold leading-tight text-foreground">
                {{ document.number }}
              </p>
              <p class="mt-0.5 text-[11px] text-muted-foreground">
                {{ document.subtitle }}
              </p>
            </div>
          </div>

          <div class="mt-3 flex items-center justify-between gap-3 border-t border-primary/15 pt-2.5">
            <span class="text-xs font-medium text-muted-foreground">
              {{ locale.t.amendments.drawer.newTotal }}
            </span>
            <span class="text-base font-bold tabular-nums text-primary">
              {{ formatPrice(document.after.total) }}
            </span>
          </div>
          <div class="mt-1 flex items-center justify-between gap-3">
            <span class="text-xs font-medium text-muted-foreground">
              {{ locale.t.amendments.drawer.delta }}
            </span>
            <span
              class="text-xs font-semibold tabular-nums"
              :class="delta > 0 ? 'text-primary' : delta < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'"
            >
              {{ deltaLabel }}
            </span>
          </div>
        </div>

        <p
          v-if="moneyNote"
          class="rounded-2xl px-3.5 py-3 text-[12px] leading-relaxed"
          :class="document.delta_direction === 'charge'
            ? 'bg-primary/10 text-foreground'
            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'"
        >
          {{ moneyNote }}
        </p>

        <p class="text-[13px] leading-relaxed text-muted-foreground">
          {{ document.reason ? `${locale.t.amendments.drawer.reason}: ${document.reason}` : '' }}
        </p>

        <!-- Clauses -->
        <section
          v-for="section in document.sections"
          :key="section.key"
          class="space-y-2"
        >
          <h4 class="text-sm font-semibold text-foreground">
            {{ section.heading }}
          </h4>

          <p
            v-for="(paragraph, i) in section.paragraphs"
            :key="i"
            class="text-[13px] leading-relaxed text-muted-foreground"
          >
            {{ paragraph }}
          </p>

          <!-- Pricelist: the new edition, and the previous one for reference -->
          <div
            v-if="section.type === 'items_after' || section.type === 'items_before'"
            class="overflow-hidden rounded-2xl border border-border/70"
            :class="section.type === 'items_before' && 'opacity-70'"
          >
            <ul class="divide-y divide-border/60">
              <li
                v-for="(item, i) in side(section.type)?.items ?? []"
                :key="i"
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
              <span class="text-sm font-bold tabular-nums text-foreground">
                {{ formatPrice(side(section.type)?.total ?? 0) }}
              </span>
            </div>
          </div>

          <!-- Requisites of the three parties -->
          <div
            v-if="section.type === 'parties'"
            class="space-y-2"
          >
            <div
              v-for="row in partyRows"
              :key="row.key"
              class="rounded-2xl bg-muted/50 px-3.5 py-3 dark:bg-white/5"
            >
              <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {{ row.label }}
              </p>
              <p class="mt-0.5 text-sm font-semibold text-foreground">
                {{ row.name }}
              </p>
            </div>
          </div>
        </section>

        <p class="rounded-2xl bg-muted/50 px-3.5 py-3 text-[11px] leading-relaxed text-muted-foreground dark:bg-white/5">
          {{ locale.t.amendments.drawer.hint }}
        </p>

        <label class="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-border/70 px-3.5 py-3">
          <Checkbox
            v-model="consented"
            class="mt-0.5"
          />
          <span class="text-[13px] font-medium leading-snug text-foreground">
            {{ locale.t.amendments.drawer.consent }}
          </span>
        </label>

        <Button
          class="btn-brand h-12 w-full rounded-2xl text-base font-semibold"
          :disabled="!canAccept"
          @click="emit('accept')"
        >
          <Loader2
            v-if="submitting"
            class="size-4 shrink-0 animate-spin"
          />
          <CheckCircle2
            v-else
            class="size-4 shrink-0"
          />
          {{ submitLabel }}
        </Button>
      </template>
    </div>
  </Drawer>
</template>
