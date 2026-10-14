import axios from 'axios'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { fetchPass } from '@/modules/agent/services/pass.service'
import { passStrings } from '@/modules/agent/lib/pass-i18n'
import type { AgentPass, ClaimBlockCode } from '@/modules/agent/types/pass'

/**
 * Per-order fee + the wallet that pays it. An agent pays once per order: on
 * the otklik (Tender, Tezkor "pay to respond") or when taking a Tezkor job
 * the client picked ("pay on pick"). A short balance opens the top-up drawer,
 * which resends the blocked action once the balance is topped up.
 */
export const usePassStore = defineStore('agent-pass', () => {
  const pass = ref<AgentPass | null>(null)
  const loaded = ref(false)
  const drawerOpen = ref(false)
  /** Fee the blocked action needs (from the 402, else the default price). */
  const neededSom = ref<number | null>(null)

  /** Action to resend once the agent has topped up; may return its promise. */
  let retry: (() => unknown) | null = null

  const enforce = computed(() => pass.value?.enforce === true)
  const walletEnabled = computed(() => pass.value?.wallet_enabled === true)
  /** Fees are actually being charged (both server switches on). */
  const feesOn = computed(() => enforce.value && walletEnabled.value)
  const balanceSom = computed(() => pass.value?.balance_som ?? 0)
  /** Default per-order fee (0 when fees are off). */
  const feeSom = computed(() => (feesOn.value ? (pass.value?.response_price_som ?? 0) : 0))

  async function load(): Promise<AgentPass | null> {
    try {
      const data = await fetchPass()
      pass.value = data
      loaded.value = true
      return data
    }
    catch {
      // Non-agents / transient errors: leave state untouched.
      return pass.value
    }
  }

  let inflight: Promise<AgentPass | null> | null = null
  function ensureLoaded(): Promise<AgentPass | null> {
    if (loaded.value) return Promise.resolve(pass.value)
    inflight ??= load().finally(() => { inflight = null })
    return inflight
  }

  /** Can the balance cover this fee? */
  function canAfford(fee: number): boolean {
    return balanceSom.value >= fee
  }

  /**
   * Inspect a failed paid action (otklik / take). Returns true when it was a
   * fee gate this store fully handled (drawer / toast) so the caller shows
   * nothing more.
   */
  function handleClaimError(e: unknown, onRetry?: () => unknown): boolean {
    if (!axios.isAxiosError(e) || e.response?.status !== 402) return false
    const body = e.response.data as { code?: ClaimBlockCode, message?: string, data?: { price_som?: number } | null } | undefined
    const t = passStrings(useLocaleStore().locale)
    const toast = useToast()

    switch (body?.code) {
      case 'insufficient_balance':
        promptTopup(onRetry, body.data?.price_som)
        void load()
        return true
      case 'payment_source_unavailable':
        toast.error(t.paymentUnavailable)
        return true
      default:
        toast.error(body?.message || t.genericError)
        return true
    }
  }

  /** Balance below the fee — open the top-up drawer, resend afterwards. */
  function promptTopup(onRetry?: () => unknown, fee?: number) {
    retry = onRetry ?? null
    neededSom.value = fee ?? null
    drawerOpen.value = true
  }

  /** Leaving the drawer for the card page — keep the pending retry. */
  function openCardCheckout() {
    drawerOpen.value = false
  }

  /** The card page topped the balance up — adopt it and resend a pending action. */
  function completeTopup(summary: AgentPass) {
    pass.value = summary
    loaded.value = true
    drawerOpen.value = false
    useToast().success(passStrings(useLocaleStore().locale).topupToast)
    const run = retry
    retry = null
    // The resent action takes its fee — refresh so the balance shown is current.
    if (run) void Promise.resolve(run()).finally(() => void load())
  }

  function closeDrawer() {
    drawerOpen.value = false
    retry = null
  }

  function reset() {
    pass.value = null
    loaded.value = false
    retry = null
  }

  return {
    pass, loaded, drawerOpen, neededSom,
    enforce, walletEnabled, feesOn, balanceSom, feeSom,
    load, ensureLoaded, canAfford, handleClaimError, promptTopup, closeDrawer, reset,
    openCardCheckout, completeTopup,
  }
})
