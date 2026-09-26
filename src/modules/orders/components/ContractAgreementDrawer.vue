<script setup lang="ts">
import { CheckCircle2, FileSignature, Loader2 } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import Drawer from '@/core/ui/Drawer.vue'
import { Button } from '@/core/ui/button'
import { Checkbox } from '@/core/ui/checkbox'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatDateTime } from '@/core/lib/date'
import { formatPrice } from '@/modules/orders/lib/order-status'
import type { ContractDocument, OfferContractState } from '@/modules/orders/types/order'

/**
 * The three-party service contract (client ↔ provider ↔ platform as operator),
 * shown for confirmation before the binding action: the agent sends a priced
 * offer, the client accepts one. Tapping accept is the electronic acceptance —
 * the backend logs it against this exact document (see `hash`).
 */
const props = defineProps<{
  /** Contract as rendered by the API; null while it is still loading. */
  document: ContractDocument | null
  /** Who is about to accept — decides the CTA copy. */
  party: 'agent' | 'client'
  loading?: boolean
  submitting?: boolean
  /** Acceptances already on record for this offer. */
  acceptances?: OfferContractState | null
  error?: string | null
}>()

const emit = defineEmits<{ accept: [] }>()

const open = defineModel<boolean>('open', { default: false })

const locale = useLocaleStore()

const consented = ref(false)

// Every re-open starts from an unchecked box — consent is per document.
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
  props.party === 'agent'
    ? locale.t.orders.contract.acceptAgent
    : locale.t.orders.contract.acceptClient,
)

/** Trim trailing zeros from quantity (2.000 → 2, 1.500 → 1.5). */
function fmtQty(value: string): string {
  const n = Number(value)
  if (Number.isNaN(n)) return value
  return Number.isInteger(n) ? String(n) : String(n).replace(/\.?0+$/, '')
}
</script>

<template>
  <Drawer
    v-model:open="open"
    :title="locale.t.orders.contract.agreementTitle"
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
        <!-- Header: document identity -->
        <div class="rounded-2xl bg-primary/8 px-4 py-3">
          <div class="flex items-start gap-3">
            <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
              <FileSignature class="size-5" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold leading-tight text-foreground">
                {{ document.title }}
              </p>
              <p class="mt-0.5 text-[11px] text-muted-foreground">
                {{ locale.t.orders.contract.docNumber }} {{ document.number }} ·
                {{ locale.t.orders.contract.agreementSubtitle }}
              </p>
            </div>
          </div>

          <div class="mt-3 flex items-center justify-between gap-3 border-t border-primary/15 pt-2.5">
            <span class="text-xs font-medium text-muted-foreground">
              {{ locale.t.orders.pricelist.total }}
            </span>
            <span class="text-base font-bold tabular-nums text-primary">
              {{ formatPrice(document.total) }}
            </span>
          </div>
          <div
            v-if="document.deadline_label"
            class="mt-1 flex items-center justify-between gap-3"
          >
            <span class="text-xs font-medium text-muted-foreground">
              {{ locale.t.orders.contract.deadlineLabel }}
            </span>
            <span class="text-xs font-semibold text-foreground">
              {{ document.deadline_label }}
            </span>
          </div>
        </div>

        <!-- Acceptances already on record -->
        <div
          v-if="acceptances?.agent_accepted_at || acceptances?.client_accepted_at"
          class="space-y-1 rounded-2xl bg-emerald-500/10 px-3.5 py-2.5"
        >
          <p
            v-if="acceptances?.agent_accepted_at"
            class="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
          >
            <CheckCircle2 class="size-3.5 shrink-0" />
            {{ locale.t.orders.contract.acceptedByAgent }} · {{ formatDateTime(acceptances.agent_accepted_at) }}
          </p>
          <p
            v-if="acceptances?.client_accepted_at"
            class="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
          >
            <CheckCircle2 class="size-3.5 shrink-0" />
            {{ locale.t.orders.contract.acceptedByClient }} · {{ formatDateTime(acceptances.client_accepted_at) }}
          </p>
        </div>

        <!-- Preamble -->
        <p class="whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
          {{ document.intro }}
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

          <!-- Order card (§2) -->
          <dl
            v-if="section.type === 'items' && section.rows?.length"
            class="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70"
          >
            <div
              v-for="row in section.rows"
              :key="row.label"
              class="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 px-3 py-2 text-[12px]"
            >
              <dt class="font-medium text-muted-foreground">
                {{ row.label }}
              </dt>
              <dd class="min-w-0 break-words text-foreground">
                {{ row.value }}
              </dd>
            </div>
          </dl>

          <!-- Pricelist -->
          <div
            v-if="section.type === 'items'"
            class="overflow-hidden rounded-2xl border border-border/70"
          >
            <ul class="divide-y divide-border/60">
              <li
                v-for="(item, i) in document.items"
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
              <span class="text-base font-bold tabular-nums text-primary">
                {{ formatPrice(document.total) }}
              </span>
            </div>
          </div>

          <!-- Requisites of the three parties -->
          <div
            v-if="section.type === 'parties'"
            class="space-y-2"
          >
            <div
              v-for="block in section.parties ?? []"
              :key="block.key"
              class="rounded-2xl bg-muted/50 px-3.5 py-3 dark:bg-white/5"
            >
              <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {{ block.label }}
              </p>
              <p class="mt-0.5 text-sm font-semibold text-foreground">
                {{ block.name }}
              </p>
              <dl
                v-if="block.rows.length"
                class="mt-1.5 space-y-0.5"
              >
                <div
                  v-for="row in block.rows"
                  :key="row.label"
                  class="flex items-baseline justify-between gap-3 text-[11px]"
                >
                  <dt class="shrink-0 text-muted-foreground">
                    {{ row.label }}
                  </dt>
                  <dd class="min-w-0 break-words text-right font-medium text-foreground">
                    {{ row.value }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <p class="rounded-2xl bg-muted/50 px-3.5 py-3 text-[11px] leading-relaxed text-muted-foreground dark:bg-white/5">
          {{ locale.t.orders.contract.reviewHint }}
        </p>

        <!-- Consent + accept -->
        <label class="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-border/70 px-3.5 py-3">
          <Checkbox
            v-model="consented"
            class="mt-0.5"
          />
          <span class="text-[13px] font-medium leading-snug text-foreground">
            {{ locale.t.orders.contract.consentLabel }}
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
