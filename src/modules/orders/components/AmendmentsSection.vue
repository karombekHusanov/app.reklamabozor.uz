<script setup lang="ts">
import { FileEdit } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import Drawer from '@/core/ui/Drawer.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import PricelistBuilder from '@/modules/orders/components/PricelistBuilder.vue'
import AmendmentCard from '@/modules/orders/components/AmendmentCard.vue'
import AmendmentAgreementDrawer from '@/modules/orders/components/AmendmentAgreementDrawer.vue'
import { formatDateTime } from '@/core/lib/date'
import { useAmendments } from '@/modules/orders/composables/useAmendments'
import type { AmendmentWindow, OfferItem, PricelistItemInput } from '@/modules/orders/types/order'

const props = defineProps<{
  orderId: number
  isActive: boolean
  initialItems: OfferItem[]
  initialDeadlineDays: number | null
  /** Who may propose right now — the client's window is limited, the agent's is not. */
  window?: AmendmentWindow | null
}>()

const locale = useLocaleStore()
const { haptic } = useTelegram()
const {
  amendments,
  openAmendment,
  submitting,
  document,
  documentLoading,
  documentError,
  load,
  preview,
  loadDocument,
  propose,
  approve,
  reject,
  cancel,
} = useAmendments()

const drawerOpen = ref(false)
const reason = ref('')

// Second step: the addendum text, accepted click-wrap style.
const agreementOpen = ref(false)
const agreementMode = ref<'propose' | 'approve'>('propose')
const draft = ref<{ items: PricelistItemInput[], deadlineDays: number } | null>(null)
const approvingId = ref<number | null>(null)

onMounted(() => load(props.orderId))

/** The client may only propose early in the delivery time; the agent always may. */
const canPropose = computed(() => props.window?.can_propose ?? props.isActive)
const windowNote = computed(() => {
  const reasonCode = props.window?.reason
  if (reasonCode === 'window_closed') return locale.t.amendments.windowClosed
  if (reasonCode === 'pending_exists') return locale.t.amendments.windowPending
  return null
})
const windowEndsLabel = computed(() =>
  canPropose.value && props.window?.ends_at
    ? `${locale.t.amendments.windowOpenUntil}: ${formatDateTime(props.window.ends_at)}`
    : null,
)

function openProposeDrawer() {
  haptic('light')
  reason.value = ''
  drawerOpen.value = true
}

/** Step 1 → the addendum built from the rows the user just filled in. */
async function submitProposal(payload: { items: PricelistItemInput[], deadlineDays: number }) {
  draft.value = payload
  agreementMode.value = 'propose'
  drawerOpen.value = false
  agreementOpen.value = true
  haptic('light')

  await preview(props.orderId, {
    items: payload.items,
    deadline_days: payload.deadlineDays,
    reason: reason.value.trim() || null,
  })
}

/** Step 2 → sending it is the initiator's acceptance. */
async function confirmProposal() {
  if (!draft.value) return
  const ok = await propose(props.orderId, {
    items: draft.value.items,
    deadline_days: draft.value.deadlineDays,
    reason: reason.value.trim() || null,
  })
  if (ok) {
    haptic('medium')
    agreementOpen.value = false
    draft.value = null
  }
}

/** Answering someone else's proposal opens the same document first. */
async function openApproval(id: number) {
  approvingId.value = id
  agreementMode.value = 'approve'
  agreementOpen.value = true
  haptic('light')
  await loadDocument(id)
}

async function confirmApproval() {
  if (approvingId.value === null) return
  const ok = await approve(approvingId.value, document.value?.hash ?? null)
  if (ok) {
    haptic('medium')
    agreementOpen.value = false
    approvingId.value = null
  }
}

function onAgreementAccept() {
  if (agreementMode.value === 'propose') void confirmProposal()
  else void confirmApproval()
}
</script>

<template>
  <section
    v-if="isActive || amendments.length > 0"
    class="space-y-3"
  >
    <div class="flex items-center justify-between gap-2 px-1">
      <div class="flex items-center gap-2">
        <FileEdit class="size-4 text-primary" />
        <h3 class="text-base font-semibold text-foreground">
          {{ locale.t.amendments.sectionTitle }}
        </h3>
      </div>
      <Button
        v-if="canPropose && !openAmendment"
        variant="outline"
        size="sm"
        class="rounded-full"
        @click="openProposeDrawer"
      >
        {{ locale.t.amendments.propose }}
      </Button>
    </div>

    <p
      v-if="windowEndsLabel"
      class="px-1 text-[11.5px] text-muted-foreground"
    >
      {{ windowEndsLabel }}
    </p>
    <p
      v-else-if="windowNote && isActive"
      class="rounded-2xl bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground dark:bg-white/5"
    >
      {{ windowNote }}
    </p>

    <p
      v-if="amendments.length === 0"
      class="rounded-2xl bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground dark:bg-white/5"
    >
      {{ locale.t.amendments.emptyHint }}
    </p>

    <AmendmentCard
      v-for="amendment in amendments"
      :key="amendment.id"
      :amendment="amendment"
      :submitting="submitting"
      @approve="openApproval"
      @reject="reject"
      @cancel="cancel"
    />

    <Drawer
      v-model:open="drawerOpen"
      :title="locale.t.amendments.proposeTitle"
    >
      <div class="space-y-4 pb-2">
        <p class="rounded-2xl bg-muted/50 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground dark:bg-white/5">
          {{ locale.t.amendments.proposeHint }}
        </p>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-foreground">
            {{ locale.t.amendments.reasonLabel }}
          </label>
          <textarea
            v-model="reason"
            rows="2"
            :placeholder="locale.t.amendments.reasonPlaceholder"
            class="glass-input w-full resize-none text-sm"
          />
        </div>

        <PricelistBuilder
          :initial-items="initialItems"
          :initial-deadline-days="initialDeadlineDays"
          :submitting="submitting"
          @submit="submitProposal"
        />
      </div>
    </Drawer>

    <AmendmentAgreementDrawer
      v-model:open="agreementOpen"
      :document="document"
      :mode="agreementMode"
      :loading="documentLoading"
      :submitting="submitting"
      :error="documentError"
      @accept="onAgreementAccept"
    />
  </section>
</template>
