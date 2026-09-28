import axios from 'axios'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { openExternalLink } from '@/core/lib/telegram-init'
import { fetchPass, fetchPassHistory, purchasePass } from '@/modules/agent/services/pass.service'
import { passStrings } from '@/modules/agent/lib/pass-i18n'
import type { AgentPass, ClaimBlockCode, PassHistoryItem } from '@/modules/agent/types/pass'

const POLL_MS = 4000
const POLL_MAX_MS = 3 * 60 * 1000

export const usePassStore = defineStore('agent-pass', () => {
  const pass = ref<AgentPass | null>(null)
  const history = ref<PassHistoryItem[]>([])
  const loaded = ref(false)
  const buying = ref(false)
  const awaitingPayment = ref(false)
  const drawerOpen = ref(false)
  /** Why the drawer is open: no Propusk (daily pass) or balance below one otklik fee. */
  const drawerReason = ref<'pass' | 'balance'>('pass')

  // Live countdown: anchor the server's seconds_left to the moment it was received.
  const anchorAt = ref(Date.now())
  const now = ref(Date.now())
  let tick: ReturnType<typeof setInterval> | null = null
  let poll: ReturnType<typeof setInterval> | null = null
  /** Otklik to resend once the agent has paid; may return its promise. */
  let retry: (() => unknown) | null = null

  const secondsLeft = computed(() => {
    if (!pass.value?.active) return 0
    const elapsed = Math.floor((now.value - anchorAt.value) / 1000)
    return Math.max(0, pass.value.seconds_left - elapsed)
  })
  const isActive = computed(() => Boolean(pass.value?.active) && secondsLeft.value > 0)
  const enforce = computed(() => pass.value?.enforce === true)
  const walletEnabled = computed(() => pass.value?.wallet_enabled === true)
  /** Pay-per-otklik: each response (Tezkor or Tender) is debited from the balance. */
  const perResponse = computed(() => pass.value?.mode === 'per_response')
  const balanceSom = computed(() => pass.value?.balance_som ?? 0)
  /** Per-otklik fee currently charged (0 when responses are free). */
  const otklikFeeSom = computed(() =>
    enforce.value && perResponse.value ? (pass.value?.response_price_som ?? 0) : 0,
  )
  const canAffordOtklik = computed(() => balanceSom.value >= otklikFeeSom.value)
  /** Tezkor CTA hint: a pass is required and the agent has none. */
  const needsPass = computed(() =>
    loaded.value && enforce.value && !isActive.value && pass.value?.mode === 'daily_pass',
  )

  function ensureTick() {
    if (tick) return
    tick = setInterval(() => {
      now.value = Date.now()
      if (pass.value?.active && secondsLeft.value <= 0) {
        stopTick()
        void load()
      }
    }, 1000)
  }
  function stopTick() {
    if (tick) clearInterval(tick)
    tick = null
  }
  function stopPoll() {
    if (poll) clearInterval(poll)
    poll = null
    awaitingPayment.value = false
  }

  async function load(): Promise<AgentPass | null> {
    try {
      const data = await fetchPass()
      pass.value = data
      anchorAt.value = Date.now()
      now.value = anchorAt.value
      loaded.value = true
      if (data.active) ensureTick()
      else stopTick()
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

  async function loadHistory() {
    try {
      history.value = await fetchPassHistory()
    }
    catch {
      history.value = []
    }
  }

  function onActivated() {
    stopPoll()
    drawerOpen.value = false
    useToast().success(passStrings(useLocaleStore().locale).activatedToast)
    const run = retry
    retry = null
    void loadHistory()
    if (run) run()
  }

  function startPolling() {
    stopPoll()
    awaitingPayment.value = true
    const startedAt = Date.now()
    poll = setInterval(async () => {
      const data = await load()
      if (data?.active) onActivated()
      else if (Date.now() - startedAt > POLL_MAX_MS) stopPoll()
    }, POLL_MS)
  }

  /** Manual "already paid?" check. */
  async function refreshNow() {
    const data = await load()
    if (data?.active) onActivated()
  }

  async function buy() {
    if (buying.value) return
    const t = passStrings(useLocaleStore().locale)
    const toast = useToast()
    buying.value = true
    try {
      const res = await purchasePass()
      if (res.activated) {
        if (res.pass) {
          pass.value = res.pass
          anchorAt.value = Date.now()
          now.value = anchorAt.value
          ensureTick()
        }
        else await load()
        onActivated()
        return
      }
      if (res.checkout_url) {
        toast.info(t.paymentOpened)
        openExternalLink(res.checkout_url)
        startPolling()
      }
    }
    catch (e) {
      const status = axios.isAxiosError(e) ? e.response?.status : undefined
      const code = axios.isAxiosError(e) ? (e.response?.data as { code?: string } | undefined)?.code : undefined
      if (status === 503 || code === 'gateway_unavailable') toast.error(t.gatewayUnavailable)
      else if (code === 'insufficient_balance') toast.error(t.insufficientBalance)
      else toast.error(t.genericError)
    }
    finally {
      buying.value = false
    }
  }

  /**
   * Inspect a failed claim. Returns true when the error was a Propusk/claim gate
   * that this store fully handled (drawer / toast) so the caller shows nothing more.
   */
  function handleClaimError(e: unknown, onRetry?: () => unknown): boolean {
    if (!axios.isAxiosError(e) || e.response?.status !== 402) return false
    const body = e.response.data as { code?: ClaimBlockCode, message?: string } | undefined
    const t = passStrings(useLocaleStore().locale)
    const toast = useToast()

    switch (body?.code) {
      case 'pass_required':
        retry = onRetry ?? null
        drawerReason.value = 'pass'
        drawerOpen.value = true
        void load()
        return true
      case 'insufficient_balance':
        // Per-otklik fee: offer the top-up and resend the otklik afterwards.
        retry = onRetry ?? null
        drawerReason.value = 'balance'
        drawerOpen.value = true
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

  /** Balance already below one fee — go straight to the top-up drawer. */
  function promptTopup(onRetry?: () => unknown) {
    retry = onRetry ?? null
    drawerReason.value = 'balance'
    drawerOpen.value = true
  }

  /** Leaving the drawer for the card page — keep the pending claim retry. */
  function openCardCheckout() {
    drawerOpen.value = false
  }

  /** The card page confirmed the payment — adopt the fresh summary. */
  function completeCardPayment(summary: AgentPass) {
    pass.value = summary
    anchorAt.value = Date.now()
    now.value = anchorAt.value
    loaded.value = true
    if (summary.active) {
      ensureTick()
      onActivated()
    }
  }

  /** The card page topped the balance up — adopt it and resend a pending otklik. */
  function completeTopup(summary: AgentPass) {
    pass.value = summary
    anchorAt.value = Date.now()
    now.value = anchorAt.value
    loaded.value = true
    stopPoll()
    drawerOpen.value = false
    useToast().success(passStrings(useLocaleStore().locale).topupToast)
    const run = retry
    retry = null
    // The resent otklik takes its fee — refresh so the balance shown is current.
    if (run) void Promise.resolve(run()).finally(() => void load())
  }

  function closeDrawer() {
    drawerOpen.value = false
    retry = null
    stopPoll()
  }

  function reset() {
    pass.value = null
    history.value = []
    loaded.value = false
    retry = null
    stopTick()
    stopPoll()
  }

  return {
    pass, history, loaded, buying, awaitingPayment, drawerOpen, drawerReason,
    secondsLeft, isActive, enforce, walletEnabled, perResponse, balanceSom, otklikFeeSom, canAffordOtklik, needsPass,
    load, ensureLoaded, loadHistory, buy, refreshNow, handleClaimError, closeDrawer, reset,
    openCardCheckout, completeCardPayment, completeTopup, promptTopup,
  }
})
