<script setup lang="ts">
import { CheckCircle2, Clock, Loader2 } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useToast } from '@/core/composables/useToast'
import { useTelegram } from '@/core/composables/useTelegram'
import { getApiErrorMessage } from '@/core/api/api-error'
import { confirmAction } from '@/core/lib/confirm-action'
import { formatDateTime } from '@/core/lib/date'
import { fmtSom, passStrings } from '@/modules/agent/lib/pass-i18n'
import { usePassStore } from '@/modules/agent/stores/pass.store'
import { declinePick, takePickedOffer } from '@/modules/orders/services/orders.service'
import type { AgentOfferDetail } from '@/modules/orders/types/order'

/**
 * Tezkor "pay on pick", agent side: the client picked this otklik. The agent
 * pays the per-order fee to take the job before the window runs out, or
 * declines (the client then picks again). A short balance opens the top-up
 * drawer and the take resends once the balance is topped up.
 */
const props = defineProps<{ offer: AgentOfferDetail }>()
const emit = defineEmits<{ updated: [offer: AgentOfferDetail] }>()

const locale = useLocaleStore()
const toast = useToast()
const pass = usePassStore()
const { haptic } = useTelegram()

const t = computed(() => passStrings(locale.locale))
const pick = computed(() => props.offer.pick ?? null)
// The server already sends 0 when fees are off.
const fee = computed(() => pick.value?.fee_som ?? 0)
const feeLabel = computed(() => fmtSom(fee.value, t.value.unit))

// Live countdown to the end of the payment window.
const now = ref(Date.now())
let tick: ReturnType<typeof setInterval> | null = null
const minutesLeft = computed(() => {
  if (!pick.value) return 0
  return Math.max(0, Math.ceil((new Date(pick.value.expires_at).getTime() - now.value) / 60_000))
})
const expired = computed(() => pick.value !== null && minutesLeft.value <= 0)
const until = computed(() => (pick.value ? formatDateTime(pick.value.expires_at) : ''))

const body = computed(() =>
  (fee.value > 0 ? t.value.takeBody.replace('{price}', feeLabel.value) : t.value.takeBodyFree)
    .replace('{time}', until.value),
)

const taking = ref(false)
const declining = ref(false)

async function take() {
  if (taking.value || expired.value) return
  await pass.ensureLoaded()
  if (pass.feesOn && fee.value > 0 && !pass.canAfford(fee.value)) {
    pass.promptTopup(() => take(), fee.value)
    return
  }
  taking.value = true
  haptic('medium')
  try {
    const updated = await takePickedOffer(props.offer.id)
    toast.success(t.value.takeDone)
    void pass.load()
    emit('updated', updated)
  }
  catch (e) {
    if (!pass.handleClaimError(e, () => take())) toast.error(getApiErrorMessage(e) || t.value.genericError)
  }
  finally {
    taking.value = false
  }
}

async function decline() {
  if (declining.value) return
  const ok = await confirmAction({
    title: t.value.takeDeclineTitle,
    message: t.value.takeDeclineBody,
    confirmLabel: t.value.takeDecline,
    tone: 'danger',
  })
  if (!ok) return
  declining.value = true
  try {
    emit('updated', await declinePick(props.offer.id))
  }
  catch (e) {
    toast.error(getApiErrorMessage(e) || t.value.genericError)
  }
  finally {
    declining.value = false
  }
}

onMounted(() => {
  void pass.ensureLoaded()
  tick = setInterval(() => { now.value = Date.now() }, 15_000)
})
onBeforeUnmount(() => {
  if (tick) clearInterval(tick)
})
</script>

<template>
  <div
    v-if="pick"
    class="take"
    role="region"
    :aria-label="t.takeTitle"
  >
    <div class="take__head">
      <span
        class="take__icon"
        aria-hidden="true"
      ><CheckCircle2 class="size-5" /></span>
      <p class="take__title">
        {{ t.takeTitle }}
      </p>
      <span
        class="take__timer"
        :class="{ 'is-expired': expired }"
      >
        <Clock
          class="size-3.5"
          aria-hidden="true"
        />
        {{ expired ? t.takeExpired : t.takeLeft.replace('{m}', String(minutesLeft)) }}
      </span>
    </div>

    <p class="take__body">
      {{ body }}
    </p>

    <div class="take__actions">
      <button
        type="button"
        class="take__btn take__btn--primary"
        :disabled="taking || declining || expired"
        @click="take"
      >
        <Loader2
          v-if="taking"
          class="size-[18px] animate-spin"
        />
        {{ fee > 0 ? t.takeCta.replace('{price}', feeLabel) : t.takeCtaFree }}
      </button>
      <button
        type="button"
        class="take__btn take__btn--soft"
        :disabled="taking || declining"
        @click="decline"
      >
        <Loader2
          v-if="declining"
          class="size-[18px] animate-spin"
        />
        {{ t.takeDecline }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.take {
  display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: var(--rb-r-card);
  background: color-mix(in srgb, var(--rb-glow) 10%, var(--card)); border: 1px solid color-mix(in srgb, var(--rb-glow) 35%, var(--border));
  box-shadow: var(--rb-elev-1);
}
.take__head { display: flex; align-items: center; gap: 10px; }
.take__icon {
  display: inline-flex; width: 36px; height: 36px; flex-shrink: 0; align-items: center; justify-content: center;
  border-radius: 12px; background: color-mix(in srgb, var(--rb-glow) 22%, transparent); color: var(--foreground);
}
.take__title { flex: 1; margin: 0; font-family: var(--rb-font-display); font-size: 16px; font-weight: 800; color: var(--foreground); }
.take__timer {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px;
  background: var(--card); font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--foreground); white-space: nowrap;
}
.take__timer.is-expired { color: var(--destructive); }
.take__body { margin: 0; font-size: 13.5px; line-height: 1.45; color: var(--foreground); }
.take__actions { display: flex; flex-direction: column; gap: 8px; }
.take__btn {
  display: inline-flex; min-height: 48px; align-items: center; justify-content: center; gap: 8px;
  border: 0; border-radius: 999px; font-size: 14.5px; font-weight: 700; cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: transform var(--rb-dur) var(--rb-ease);
}
.take__btn:active { transform: scale(0.98); }
.take__btn--primary { background: var(--rb-cta); color: #fff; }
.take__btn--soft { background: var(--secondary); color: var(--foreground); }
.take__btn:disabled { opacity: 0.55; cursor: default; }
.take__btn:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .take__btn { transition: none; } }
</style>
