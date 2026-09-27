<script setup lang="ts">
/**
 * Card payment (ATMOS merchant flow): card number + expiry → ATMOS texts an
 * SMS code → confirm. Two uses: buy a Propusk (daily-pass mode), or — with
 * `?topup=1` — top up the balance each otklik fee is taken from (per-otklik
 * mode). Card data lives only in this component's memory for the resend
 * button; it is never persisted. With "save card" the SMS code binds the card
 * at ATMOS (we keep only its token server-side); a saved card is then charged
 * at once — no card number, no SMS step.
 */
import axios from 'axios'
import { Check, CheckCircle2, CreditCard, Loader2, Lock, MessageSquareText, Plus, Trash2 } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { navigateBack } from '@/core/lib/navigation'
import { fmtSom, passStrings } from '@/modules/agent/lib/pass-i18n'
import { DEFAULT_TOPUP_SOM, TOPUP_PRESETS } from '@/modules/agent/lib/topup'
import { confirmCardPayment, fetchSavedCards, removeSavedCard, startCardPayment, startWalletTopup } from '@/modules/agent/services/pass.service'
import { usePassStore } from '@/modules/agent/stores/pass.store'
import type { CardInput, CardPaymentStart, SavedCard } from '@/modules/agent/types/pass'

type Step = 'card' | 'otp' | 'pending' | 'done'
type Brand = 'humo' | 'uzcard' | 'mastercard' | 'visa'

const RESEND_SECONDS = 60

const router = useRouter()
const route = useRoute()
const locale = useLocaleStore()
const store = usePassStore()
const { pass } = storeToRefs(store)
const { haptic } = useTelegram()

const t = computed(() => passStrings(locale.locale))
const hours = computed(() => pass.value?.hours ?? 24)
/* ── what is being paid for ───────────────────────────────────────── */
const isTopup = computed(() => route.query.topup === '1')
const feeSom = computed(() => pass.value?.response_price_som ?? 1000)
const topupOptions = computed(() => TOPUP_PRESETS.filter(v => v >= feeSom.value))
// Preselected from the "not enough balance" sheet (`?amount=`), else 10 000.
const queryAmount = Number(route.query.amount)
const topupSom = ref(TOPUP_PRESETS.includes(queryAmount) ? queryAmount : DEFAULT_TOPUP_SOM)
const balanceBefore = ref(0)

const amountSom = computed(() => (isTopup.value ? topupSom.value : (pass.value?.price_som ?? 0)))
const amount = computed(() => fmtSom(amountSom.value, t.value.unit))
const serviceLabel = computed(() =>
  isTopup.value ? t.value.topupService : t.value.payService.replace('{hours}', String(hours.value)),
)

const step = ref<Step>('card')
const busy = ref(false)
const error = ref<string | null>(null)

/* ── saved cards ──────────────────────────────────────────────────── */
const savedCards = ref<SavedCard[]>([])
/** null = typing a new card. */
const selectedCardId = ref<number | null>(null)
const saveCard = ref(false)
const removingId = ref<number | null>(null)

async function loadSavedCards() {
  try {
    savedCards.value = await fetchSavedCards()
    selectedCardId.value = savedCards.value[0]?.id ?? null
  }
  catch {
    savedCards.value = []
  }
}

function selectCard(id: number | null) {
  selectedCardId.value = id
  removingId.value = null
  error.value = null
}

/** Two taps: the first arms the button, the second removes. */
async function removeCard(id: number) {
  if (removingId.value !== id) {
    removingId.value = id
    return
  }
  try {
    await removeSavedCard(id)
    savedCards.value = savedCards.value.filter(c => c.id !== id)
    if (selectedCardId.value === id) selectedCardId.value = savedCards.value[0]?.id ?? null
  }
  catch (e) {
    error.value = messageOf(e)
  }
  finally {
    removingId.value = null
  }
}

/* ── card step ────────────────────────────────────────────────────── */
const cardInput = ref('')
const expiryInput = ref('')
const expiryRef = ref<HTMLInputElement | null>(null)

const cardDigits = computed(() => cardInput.value.replace(/\D/g, ''))
const expiryDigits = computed(() => expiryInput.value.replace(/\D/g, ''))

/** BIN → scheme. UzCard 8600/5614, Humo 9860, Visa 4, Mastercard 51–55 / 2221–2720. */
const brand = computed<Brand | null>(() => {
  const d = cardDigits.value
  if (d.startsWith('8600') || d.startsWith('5614')) return 'uzcard'
  if (d.startsWith('9860')) return 'humo'
  if (d.startsWith('4')) return 'visa'
  const two = Number(d.slice(0, 2))
  const four = Number(d.slice(0, 4))
  if ((two >= 51 && two <= 55) || (four >= 2221 && four <= 2720)) return 'mastercard'
  return null
})

const brands: { key: Brand, label: string }[] = [
  { key: 'humo', label: 'HUMO' },
  { key: 'uzcard', label: 'UZCARD' },
  { key: 'mastercard', label: 'Mastercard' },
  { key: 'visa', label: 'VISA' },
]

function onCardInput(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 16)
  cardInput.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ')
  error.value = null
  if (digits.length === 16) void nextTick(() => expiryRef.value?.focus())
}

function onExpiryInput(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4)
  expiryInput.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
  error.value = null
}

const expiryValid = computed(() => {
  if (expiryDigits.value.length !== 4) return false
  const month = Number(expiryDigits.value.slice(0, 2))
  return month >= 1 && month <= 12
})
const cardValid = computed(() => cardDigits.value.length === 16)
const canPay = computed(() => !busy.value && (selectedCardId.value !== null || (cardValid.value && expiryValid.value)))

/* ── otp step ─────────────────────────────────────────────────────── */
const paymentRef = ref<string | null>(null)
const cardMask = ref<string | null>(null)
const otp = ref('')
const otpRef = ref<HTMLInputElement | null>(null)
const resendIn = ref(0)
let resendTimer: ReturnType<typeof setInterval> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null

function startResendTimer() {
  resendIn.value = RESEND_SECONDS
  if (resendTimer) clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    resendIn.value = Math.max(0, resendIn.value - 1)
    if (resendIn.value === 0 && resendTimer) clearInterval(resendTimer)
  }, 1000)
}

function onOtpInput(e: Event) {
  otp.value = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6)
  error.value = null
  if (otp.value.length === 6) void confirm()
}

/* ── api ──────────────────────────────────────────────────────────── */
function messageOf(e: unknown): string {
  if (!axios.isAxiosError(e)) return t.value.genericError
  const body = e.response?.data as { message?: string, code?: string, errors?: Record<string, string[]> } | undefined
  if (e.response?.status === 503 || body?.code === 'gateway_unavailable') return t.value.gatewayUnavailable
  if (body?.errors?.card_number) return t.value.errCard
  if (body?.errors?.expiry) return t.value.errExpiry
  // ATMOS's own wording for a declined card / wrong code is safe to show.
  if (body?.code === 'card_declined' || body?.code === 'otp_invalid') return body.message || t.value.genericError
  return t.value.genericError
}

async function pay() {
  if (!canPay.value) {
    error.value = !cardValid.value ? t.value.errCard : t.value.errExpiry
    return
  }
  busy.value = true
  error.value = null
  haptic('medium')
  try {
    balanceBefore.value = pass.value?.balance_som ?? 0
    const card: CardInput = selectedCardId.value !== null
      ? { card_id: selectedCardId.value }
      : { card_number: cardDigits.value, expiry: expiryInput.value, save_card: saveCard.value }
    const res = isTopup.value
      ? await startWalletTopup(topupSom.value, card)
      : await startCardPayment(card)
    if (!res.requires_otp) {
      settle(res)
      return
    }
    paymentRef.value = res.payment_ref
    cardMask.value = res.card_mask
    otp.value = ''
    step.value = 'otp'
    startResendTimer()
    void nextTick(() => otpRef.value?.focus())
  }
  catch (e) {
    error.value = messageOf(e)
    haptic('heavy')
  }
  finally {
    busy.value = false
  }
}

async function confirm() {
  if (!paymentRef.value || otp.value.length < 4 || busy.value) return
  busy.value = true
  error.value = null
  try {
    const res = await confirmCardPayment(paymentRef.value, otp.value)
    if (res.status === 'success') finish(res.summary)
    else if (res.status === 'pending') waitForBank()
    else error.value = t.value.genericError
  }
  catch (e) {
    error.value = messageOf(e)
    otp.value = ''
    haptic('heavy')
  }
  finally {
    busy.value = false
  }
}

/** Saved card: charged at once, no SMS step. */
function settle(res: CardPaymentStart) {
  if (res.status === 'success' && res.summary) finish(res.summary)
  else if (res.status === 'pending') waitForBank()
  else error.value = t.value.genericError
}

/** The bank answered late — the pass endpoint settles pending payments. */
function waitForBank() {
  step.value = 'pending'
  const startedAt = Date.now()
  pollTimer = setInterval(async () => {
    const data = await store.load()
    const settled = isTopup.value
      ? (data?.balance_som ?? 0) >= balanceBefore.value + topupSom.value
      : data?.active
    if (data && settled) finish(data)
    else if (Date.now() - startedAt > 90_000 && pollTimer) {
      clearInterval(pollTimer)
      error.value = t.value.genericError
    }
  }, 3000)
}

function finish(summary: NonNullable<typeof pass.value>) {
  if (pollTimer) clearInterval(pollTimer)
  if (isTopup.value) store.completeTopup(summary)
  else store.completeCardPayment(summary)
  step.value = 'done'
  haptic('medium')
}

function changeCard() {
  step.value = 'card'
  paymentRef.value = null
  otp.value = ''
  error.value = null
}

function done() {
  navigateBack(router)
}

onMounted(() => {
  void store.ensureLoaded()
  void loadSavedCards()
})

onBeforeUnmount(() => {
  if (resendTimer) clearInterval(resendTimer)
  if (pollTimer) clearInterval(pollTimer)
  // Drop card data from memory on leave.
  cardInput.value = ''
  expiryInput.value = ''
})
</script>

<template>
  <div class="pay">
    <AppHeader
      :title="isTopup ? t.topupTitle : t.payTitle"
      show-back
    />

    <div class="pay__body">
      <!-- amount -->
      <section class="pay-sum">
        <div class="pay-sum__row">
          <span>{{ serviceLabel }}</span>
          <span class="tabular-nums">{{ amount }}</span>
        </div>
        <div class="pay-sum__total">
          <span>{{ t.payTotal }}</span>
          <strong>{{ amount }}</strong>
        </div>
      </section>

      <!-- top-up amount (per-otklik mode) -->
      <section
        v-if="isTopup && step === 'card'"
        class="pay-card"
      >
        <p class="pay-label">
          {{ t.topupAmount }}
        </p>
        <div class="pay-amounts">
          <button
            v-for="v in topupOptions"
            :key="v"
            type="button"
            class="pay-amount"
            :class="{ 'is-on': topupSom === v }"
            :aria-pressed="topupSom === v"
            @click="topupSom = v"
          >
            {{ fmtSom(v, t.unit) }}
            <small>{{ t.otkliksLeft.replace('{count}', String(Math.floor(v / feeSom))) }}</small>
          </button>
        </div>
      </section>

      <!-- step 1 · saved cards -->
      <section
        v-if="step === 'card' && savedCards.length"
        class="pay-card"
      >
        <p class="pay-label">
          {{ t.savedCards }}
        </p>
        <div
          class="pay-saved"
          role="radiogroup"
          :aria-label="t.savedCards"
        >
          <div
            v-for="c in savedCards"
            :key="c.id"
            class="pay-saved__row"
            :class="{ 'is-on': selectedCardId === c.id }"
          >
            <button
              type="button"
              role="radio"
              class="pay-saved__pick"
              :aria-checked="selectedCardId === c.id"
              @click="selectCard(c.id)"
            >
              <CreditCard
                class="pay-field__ic"
                aria-hidden="true"
              />
              <span class="pay-saved__mask">{{ c.card_mask }}</span>
              <Check
                v-if="selectedCardId === c.id"
                class="size-4 text-primary"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              class="pay-saved__remove"
              :class="{ 'is-armed': removingId === c.id }"
              :aria-label="t.removeCard"
              @click="removeCard(c.id)"
            >
              <span v-if="removingId === c.id">{{ t.removeCardConfirm }}</span>
              <Trash2
                v-else
                class="size-4"
                aria-hidden="true"
              />
            </button>
          </div>
          <button
            type="button"
            role="radio"
            class="pay-saved__pick pay-saved__new"
            :class="{ 'is-on': selectedCardId === null }"
            :aria-checked="selectedCardId === null"
            @click="selectCard(null)"
          >
            <Plus
              class="pay-field__ic"
              aria-hidden="true"
            />
            <span class="pay-saved__mask">{{ t.newCard }}</span>
          </button>
        </div>
      </section>

      <!-- step 1 · card (typed) — hidden while a saved card is picked -->
      <template v-if="step === 'card'">
        <section
          v-if="selectedCardId === null"
          class="pay-card"
        >
          <div
            class="pay-brands"
            aria-hidden="true"
          >
            <span
              v-for="b in brands"
              :key="b.key"
              class="pay-brand"
              :class="[`pay-brand--${b.key}`, { 'is-dim': brand && brand !== b.key, 'is-on': brand === b.key }]"
            >
              <template v-if="b.key === 'mastercard'"><i /><i /></template>
              <template v-else>{{ b.label }}</template>
            </span>
          </div>

          <label
            class="pay-label"
            for="pay-card"
          >{{ t.payCardNumber }}</label>
          <div class="pay-field">
            <CreditCard
              class="pay-field__ic"
              aria-hidden="true"
            />
            <input
              id="pay-card"
              :value="cardInput"
              class="pay-input pay-input--card"
              inputmode="numeric"
              autocomplete="cc-number"
              placeholder="0000 0000 0000 0000"
              maxlength="19"
              @input="onCardInput"
            >
            <span
              v-if="brand"
              class="pay-field__brand"
            >{{ brands.find(b => b.key === brand)?.label }}</span>
          </div>

          <label
            class="pay-label"
            for="pay-exp"
          >{{ t.payExpiry }}</label>
          <div class="pay-field pay-field--half">
            <input
              id="pay-exp"
              ref="expiryRef"
              :value="expiryInput"
              class="pay-input"
              inputmode="numeric"
              autocomplete="cc-exp"
              placeholder="MM/YY"
              maxlength="5"
              @input="onExpiryInput"
            >
          </div>

          <label class="pay-save">
            <input
              v-model="saveCard"
              type="checkbox"
              class="pay-save__box"
            >
            <span>
              <b>{{ t.saveCard }}</b>
              <small>{{ t.saveCardHint }}</small>
            </span>
          </label>

          <p class="pay-note">
            <Lock
              class="size-3.5 shrink-0"
              aria-hidden="true"
            />
            {{ t.payNote }}
          </p>
        </section>
      </template>

      <!-- step 2 · sms code -->
      <section
        v-else-if="step === 'otp'"
        class="pay-card pay-otp"
      >
        <span
          class="pay-otp__ic"
          aria-hidden="true"
        ><MessageSquareText class="size-6" /></span>
        <h2 class="pay-otp__title">
          {{ t.otpTitle }}
        </h2>
        <p class="pay-otp__body">
          {{ t.otpBody.replace('{card}', cardMask ?? '') }}
        </p>
        <input
          ref="otpRef"
          :value="otp"
          class="pay-input pay-otp__input"
          inputmode="numeric"
          autocomplete="one-time-code"
          placeholder="••••••"
          maxlength="6"
          :aria-label="t.otpTitle"
          @input="onOtpInput"
        >
        <div class="pay-otp__links">
          <button
            type="button"
            class="pay-link"
            @click="changeCard"
          >
            {{ t.otpChangeCard }}
          </button>
          <button
            type="button"
            class="pay-link"
            :disabled="resendIn > 0 || busy"
            @click="pay"
          >
            {{ resendIn > 0 ? t.otpResendIn.replace('{s}', String(resendIn)) : t.otpResend }}
          </button>
        </div>
      </section>

      <!-- bank answered late -->
      <section
        v-else-if="step === 'pending'"
        class="pay-card pay-state"
      >
        <Loader2 class="size-9 animate-spin text-primary" />
        <h2 class="pay-otp__title">
          {{ t.pendingTitle }}
        </h2>
        <p class="pay-otp__body">
          {{ t.pendingBody }}
        </p>
      </section>

      <!-- done -->
      <section
        v-else
        class="pay-card pay-state"
      >
        <span
          class="pay-state__ok"
          aria-hidden="true"
        ><CheckCircle2 class="size-9" /></span>
        <h2 class="pay-otp__title">
          {{ isTopup ? t.topupSuccessTitle : t.successTitle }}
        </h2>
        <p class="pay-otp__body">
          {{ isTopup
            ? t.topupSuccessBody.replace('{amount}', fmtSom(pass?.balance_som ?? 0, t.unit))
            : t.successBody.replace('{hours}', String(hours)) }}
        </p>
      </section>

      <p
        v-if="error"
        class="pay-error"
        role="alert"
      >
        {{ error }}
      </p>
    </div>

    <!-- action bar -->
    <div
      v-if="step !== 'pending'"
      class="pay-bar"
    >
      <button
        v-if="step === 'card'"
        type="button"
        class="rb-primary-btn pay-bar__btn"
        :disabled="busy"
        @click="pay"
      >
        <Loader2
          v-if="busy"
          class="size-4 animate-spin"
        />
        {{ busy ? t.paySending : (isTopup ? t.topupCta : t.payCta).replace('{amount}', amount) }}
      </button>
      <button
        v-else-if="step === 'otp'"
        type="button"
        class="rb-primary-btn pay-bar__btn"
        :disabled="busy || otp.length < 4"
        @click="confirm"
      >
        <Loader2
          v-if="busy"
          class="size-4 animate-spin"
        />
        {{ busy ? t.otpChecking : t.otpCta }}
      </button>
      <button
        v-else
        type="button"
        class="rb-primary-btn pay-bar__btn"
        @click="done"
      >
        {{ t.successCta }}
      </button>

      <p class="pay-powered">
        {{ t.payPoweredBy }} <b>ATMOS</b>
      </p>
    </div>
  </div>
</template>

<style scoped>
.pay { display: flex; min-height: 100dvh; flex-direction: column; }
.pay__body { flex: 1; display: flex; flex-direction: column; gap: 14px; padding: 12px 16px 16px; }

/* amount */
.pay-sum { padding: 16px; border-radius: var(--rb-r-card); background: var(--card); border: 1px solid var(--border); box-shadow: var(--rb-elev-1); }
.pay-sum__row { display: flex; justify-content: space-between; gap: 12px; font-size: 13.5px; color: var(--muted-foreground); }
.pay-sum__total { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border); font-size: 13.5px; color: var(--muted-foreground); }
.pay-sum__total strong { font-family: var(--rb-font-display); font-size: 24px; font-weight: 900; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--foreground); }

/* top-up amount chips */
.pay-amounts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pay-amount {
  display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-height: 58px; padding: 10px 12px;
  border: 1.5px solid var(--border); border-radius: 14px; background: var(--card); cursor: pointer; text-align: left;
  font-family: var(--rb-font-display); font-size: 15px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--foreground);
  transition: border-color var(--rb-dur) var(--rb-ease), background var(--rb-dur) var(--rb-ease);
}
.pay-amount small { font-family: inherit; font-size: 11px; font-weight: 600; color: var(--muted-foreground); }
.pay-amount.is-on { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 7%, var(--card)); }
.pay-amount:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* card form */
.pay-card { padding: 16px; border-radius: var(--rb-r-card); background: var(--card); border: 1px solid var(--border); box-shadow: var(--rb-elev-1); }

.pay-brands { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
.pay-brand {
  display: grid; place-items: center; height: 38px; border-radius: 12px; background: var(--secondary); border: 1px solid transparent;
  font-family: var(--rb-font-display); font-size: 11.5px; font-weight: 900; letter-spacing: 0.02em;
  transition: opacity var(--rb-dur) var(--rb-ease), border-color var(--rb-dur) var(--rb-ease);
}
/* Scheme wordmarks in their brand hues (artwork, not UI tokens). */
.pay-brand--humo { color: #c9a227; }
.pay-brand--uzcard { color: #1f4e9c; }
.pay-brand--visa { color: #1a1f71; font-style: italic; font-size: 13px; }
.pay-brand--mastercard { grid-auto-flow: column; justify-content: center; gap: 0; }
.pay-brand--mastercard i { width: 16px; height: 16px; border-radius: 999px; background: #eb001b; }
.pay-brand--mastercard i + i { margin-left: -6px; background: #f79e1b; mix-blend-mode: multiply; }
:global(.dark) .pay-brand--uzcard, :global(.dark) .pay-brand--visa { color: #e8eefc; }
.pay-brand.is-dim { opacity: 0.35; }
.pay-brand.is-on { border-color: var(--primary); background: var(--card); }

.pay-label { display: block; margin: 0 0 6px; font-size: 12.5px; font-weight: 700; color: var(--muted-foreground); }
.pay-label + .pay-field { margin-bottom: 14px; }
.pay-field {
  display: flex; align-items: center; gap: 10px; min-height: 54px; padding: 0 14px;
  border-radius: var(--rb-r-field); background: var(--secondary); border: 1.5px solid transparent;
  transition: border-color var(--rb-dur) var(--rb-ease);
}
.pay-field:focus-within { border-color: var(--primary); background: var(--card); }
.pay-field--half { max-width: 150px; }
.pay-field__ic { width: 20px; height: 20px; flex-shrink: 0; color: var(--muted-foreground); }
.pay-field__brand {
  flex-shrink: 0; padding: 4px 8px; border-radius: 8px; background: var(--card); border: 1px solid var(--border);
  font-family: var(--rb-font-display); font-size: 10.5px; font-weight: 900; color: var(--foreground);
}
.pay-input {
  flex: 1; min-width: 0; height: 52px; border: 0; background: transparent; outline: none;
  font-size: 17px; font-weight: 600; letter-spacing: 0.04em; font-variant-numeric: tabular-nums; color: var(--foreground);
}
.pay-input::placeholder { color: color-mix(in srgb, var(--muted-foreground) 55%, transparent); }
.pay-input--card { letter-spacing: 0.08em; }

.pay-note { display: flex; align-items: flex-start; gap: 7px; margin: 4px 0 0; font-size: 11.5px; line-height: 1.45; color: var(--muted-foreground); }

/* saved cards */
.pay-saved { display: flex; flex-direction: column; gap: 8px; }
.pay-saved__row { display: flex; align-items: stretch; gap: 6px; }
.pay-saved__pick {
  flex: 1; display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 0 14px;
  border-radius: var(--rb-r-field); background: var(--secondary); border: 1.5px solid transparent; cursor: pointer; text-align: left;
  transition: border-color var(--rb-dur) var(--rb-ease), background var(--rb-dur) var(--rb-ease);
}
.pay-saved__row.is-on .pay-saved__pick, .pay-saved__new.is-on { border-color: var(--primary); background: var(--card); }
.pay-saved__pick:focus-visible, .pay-saved__remove:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.pay-saved__mask { flex: 1; font-size: 15.5px; font-weight: 700; letter-spacing: 0.04em; font-variant-numeric: tabular-nums; color: var(--foreground); }
.pay-saved__new .pay-saved__mask { letter-spacing: 0; font-size: 14px; }
.pay-saved__remove {
  display: grid; place-items: center; min-width: 48px; padding: 0 10px; border: 0; border-radius: var(--rb-r-field);
  background: var(--secondary); color: var(--muted-foreground); font-size: 12px; font-weight: 700; cursor: pointer;
}
.pay-saved__remove.is-armed { background: color-mix(in srgb, var(--destructive) 12%, var(--card)); color: var(--destructive); }

.pay-save { display: flex; align-items: flex-start; gap: 10px; margin: 2px 0 12px; cursor: pointer; }
.pay-save__box { width: 20px; height: 20px; margin-top: 1px; flex-shrink: 0; accent-color: var(--primary); }
.pay-save b { display: block; font-size: 13.5px; font-weight: 700; color: var(--foreground); }
.pay-save small { display: block; margin-top: 2px; font-size: 11.5px; line-height: 1.4; color: var(--muted-foreground); }

/* otp + states */
.pay-otp, .pay-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 22px 16px; }
.pay-otp__ic { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 18px; background: var(--secondary); color: var(--primary); }
.pay-otp__title { margin: 14px 0 0; font-family: var(--rb-font-display); font-size: 19px; font-weight: 800; letter-spacing: -0.015em; color: var(--foreground); }
.pay-otp__body { margin: 6px 0 0; max-width: 280px; font-size: 13px; line-height: 1.45; color: var(--muted-foreground); }
.pay-otp__input {
  width: 100%; max-width: 240px; flex: none; margin-top: 18px; border-radius: var(--rb-r-field); background: var(--secondary);
  border: 1.5px solid transparent; text-align: center; font-family: var(--rb-font-display); font-size: 26px; font-weight: 800; letter-spacing: 0.4em;
}
.pay-otp__input:focus { border-color: var(--primary); background: var(--card); }
.pay-otp__links { display: flex; justify-content: space-between; gap: 12px; width: 100%; max-width: 280px; margin-top: 14px; }
.pay-link { min-height: 44px; padding: 0 4px; border: 0; background: none; font-size: 13px; font-weight: 700; color: var(--primary); cursor: pointer; }
.pay-link:disabled { color: var(--muted-foreground); cursor: default; }
.pay-state__ok { display: grid; place-items: center; width: 68px; height: 68px; border-radius: 999px; color: #fff; background: var(--success); animation: payPop 420ms var(--rb-ease) both; }

.pay-error { margin: 0; padding: 10px 12px; border-radius: 12px; background: color-mix(in srgb, var(--destructive) 10%, var(--card)); color: var(--destructive); font-size: 13px; font-weight: 600; text-align: center; }

/* action bar */
.pay-bar {
  position: sticky; bottom: 0; z-index: 10; padding: 12px 16px max(env(safe-area-inset-bottom), 12px);
  background: color-mix(in srgb, var(--background) 92%, transparent); backdrop-filter: blur(10px);
}
.pay-bar__btn { width: 100%; }
.pay-powered { margin: 8px 0 0; text-align: center; font-size: 11.5px; color: var(--muted-foreground); }
.pay-powered b { font-family: var(--rb-font-display); font-weight: 900; letter-spacing: 0.12em; color: var(--foreground); }

@keyframes payPop { from { transform: scale(0.6); opacity: 0; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .pay-state__ok { animation: none; } }
</style>
