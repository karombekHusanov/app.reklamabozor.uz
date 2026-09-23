import { defineStore } from 'pinia'
import { usePassStore } from '@/modules/agent/stores/pass.store'
import { ref } from 'vue'
import { getApiErrorMessage } from '@/core/api/api-error'
import {
  acceptOffer as acceptOfferRequest,
  agentCloseOrder as agentCloseOrderRequest,
  agentReleaseOrder as agentReleaseOrderRequest,
  closeOrder as closeOrderRequest,
  releaseOrder as releaseOrderRequest,
  cancelOrder as cancelOrderRequest,
  confirmCompletion as confirmCompletionRequest,
  createOrder as createOrderRequest,
  disputeCompletion as disputeCompletionRequest,
  fetchAgentOffers,
  fetchAgentOrders,
  fetchMyOrders,
  fetchOrder,
  fetchOrderPayment,
  reportNoStart as reportNoStartRequest,
  startOfflinePayment as startOfflinePaymentRequest,
  submitOffer as submitOfferRequest,
  submitProviderReview as submitProviderReviewRequest,
  submitReview as submitReviewRequest,
  submitWork as submitWorkRequest,
} from '@/modules/orders/services/orders.service'
import type {
  AgentOffer,
  AgentOrder,
  CreateOfferPayload,
  CreateOrderPayload,
  Order,
  ReviewCriterionScore,
} from '@/modules/orders/types/order'

export const useOrdersStore = defineStore('orders', () => {
  // Client state.
  const myOrders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  // Agent state.
  const availableOrders = ref<AgentOrder[]>([])
  const myOffers = ref<AgentOffer[]>([])
  const isLoadingAgent = ref(false)
  const myOrdersLoaded = ref(false)
  const workspaceLoaded = ref(false)

  /** Coalesce parallel Home / Offers callers into one in-flight request. */
  let myOrdersInflight: Promise<void> | null = null
  let workspaceInflight: Promise<void> | null = null

  async function loadMyOrders(force = false) {
    if (myOrdersLoaded.value && !force) return
    if (myOrdersInflight) return myOrdersInflight

    myOrdersInflight = (async () => {
      isLoading.value = true
      error.value = null
      try {
        myOrders.value = await fetchMyOrders()
        myOrdersLoaded.value = true
      }
      catch (e) {
        error.value = getApiErrorMessage(e)
      }
      finally {
        isLoading.value = false
      }
    })().finally(() => {
      myOrdersInflight = null
    })

    return myOrdersInflight
  }

  async function loadOrder(id: number) {
    isLoading.value = true
    error.value = null
    try {
      currentOrder.value = await fetchOrder(id)
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
    }
    finally {
      isLoading.value = false
    }
    return currentOrder.value
  }

  async function create(payload: CreateOrderPayload) {
    isSubmitting.value = true
    error.value = null
    try {
      const order = await createOrderRequest(payload)
      myOrders.value = [order, ...myOrders.value]
      return order
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return null
    }
    finally {
      isSubmitting.value = false
    }
  }

  /**
   * Client picks a winning offer. The contract drawer must have been confirmed
   * first — its hash travels along so a revised document is refused.
   */
  async function accept(offerId: number, contractHash?: string | null) {
    isSubmitting.value = true
    error.value = null
    try {
      await acceptOfferRequest(offerId, contractHash)
      if (currentOrder.value) await loadOrder(currentOrder.value.id)
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  /** Cash desk / bank transfer: an invoice a manager confirms once paid. */
  async function requestOfflineInvoice(orderId: number, method: 'cash' | 'bank_transfer', percent: 100 | 50 = 100) {
    isSubmitting.value = true
    error.value = null
    try {
      const payment = await startOfflinePaymentRequest(orderId, method, percent)
      if (currentOrder.value?.id === orderId) await loadOrder(orderId)
      return payment
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return null
    }
    finally {
      isSubmitting.value = false
    }
  }

  /**
   * Poll the order's payment status once (used when the client returns from the
   * checkout page). Reloads the order if the payment has settled.
   */
  async function refreshPayment(orderId: number) {
    try {
      const payment = await fetchOrderPayment(orderId)
      if (payment?.status === 'success' && currentOrder.value?.id === orderId) {
        await loadOrder(orderId)
      }
      return payment
    }
    catch {
      return null
    }
  }

  /** Client accepts the delivered work — the order completes. */
  async function confirmCompletion(orderId: number) {
    isSubmitting.value = true
    error.value = null
    try {
      currentOrder.value = await confirmCompletionRequest(orderId)
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  /** Client rejects the delivered work — the ops team is notified. */
  async function disputeCompletion(orderId: number) {
    isSubmitting.value = true
    error.value = null
    try {
      currentOrder.value = await disputeCompletionRequest(orderId)
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  /**
   * Client reports that the winning agency hasn't started the paid work yet —
   * flags the order for ops review. 422 (too early / already flagged) surfaces
   * via `error`.
   */
  async function reportNoStart(orderId: number) {
    isSubmitting.value = true
    error.value = null
    try {
      currentOrder.value = await reportNoStartRequest(orderId)
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  /** Client cancels their own order (only while still open for offers). */
  async function cancelOrder(orderId: number) {
    isSubmitting.value = true
    error.value = null
    try {
      await cancelOrderRequest(orderId)
      // Cancelled orders leave the client list (kept in admin / DB only).
      myOrders.value = myOrders.value.filter(o => o.id !== orderId)
      if (currentOrder.value?.id === orderId) currentOrder.value = null
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  /** Tezkor: client closes ("Kelishildi") or rejects/reopens the claimed request. */
  async function resolveTezkor(orderId: number, action: 'close' | 'release') {
    isSubmitting.value = true
    error.value = null
    try {
      const updated = action === 'close'
        ? await closeOrderRequest(orderId)
        : await releaseOrderRequest(orderId)
      if (currentOrder.value?.id === orderId) await loadOrder(orderId)
      myOrders.value = myOrders.value.map(o => (o.id === orderId ? { ...o, ...updated } : o))
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  /** Tezkor: the claiming agent lets go of the request, or closes it as agreed. */
  async function resolveAgentTezkor(orderId: number, action: 'close' | 'release') {
    isSubmitting.value = true
    error.value = null
    try {
      action === 'close'
        ? await agentCloseOrderRequest(orderId)
        : await agentReleaseOrderRequest(orderId)
      await loadAgentWorkspace(true)
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }


  /** Client rates the winning agency on a completed order (criteria-based). */
  async function submitReview(orderId: number, criteria: ReviewCriterionScore[], comment: string | null) {
    isSubmitting.value = true
    error.value = null
    try {
      const review = await submitReviewRequest(orderId, criteria, comment)
      if (currentOrder.value?.id === orderId) {
        currentOrder.value = { ...currentOrder.value, review }
      }
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  /** Provider rates the client on a completed order (criteria-based). */
  async function submitProviderReview(orderId: number, criteria: ReviewCriterionScore[], comment: string | null) {
    isSubmitting.value = true
    error.value = null
    try {
      const review = await submitProviderReviewRequest(orderId, criteria, comment)
      if (currentOrder.value?.id === orderId) {
        currentOrder.value = { ...currentOrder.value, provider_review: review }
      }
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function loadAgentWorkspace(force = false) {
    if (workspaceLoaded.value && !force) return
    if (workspaceInflight) return workspaceInflight

    workspaceInflight = (async () => {
      isLoadingAgent.value = true
      error.value = null
      try {
        const [orders, offers] = await Promise.all([fetchAgentOrders(), fetchAgentOffers()])
        availableOrders.value = orders
        myOffers.value = offers
        workspaceLoaded.value = true
      }
      catch (e) {
        error.value = getApiErrorMessage(e)
      }
      finally {
        isLoadingAgent.value = false
      }
    })().finally(() => {
      workspaceInflight = null
    })

    return workspaceInflight
  }

  async function sendOffer(orderId: number, payload: CreateOfferPayload, onPassBought?: () => unknown) {
    isSubmitting.value = true
    error.value = null
    try {
      await submitOfferRequest(orderId, payload)
      await loadAgentWorkspace(true)
      return true
    }
    catch (e) {
      // 402 Propusk / claim gates are surfaced by the pass store (drawer / toast).
      if (usePassStore().handleClaimError(e, onPassBought)) {
        error.value = null
        return false
      }
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  /** Winning agent marks the work as delivered. */
  async function submitWork(orderId: number) {
    isSubmitting.value = true
    error.value = null
    try {
      await submitWorkRequest(orderId)
      await loadAgentWorkspace(true)
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  function reset() {
    myOrders.value = []
    currentOrder.value = null
    availableOrders.value = []
    myOffers.value = []
    myOrdersLoaded.value = false
    workspaceLoaded.value = false
    error.value = null
    myOrdersInflight = null
    workspaceInflight = null
  }

  return {
    myOrders,
    currentOrder,
    isLoading,
    isSubmitting,
    error,
    availableOrders,
    myOffers,
    isLoadingAgent,
    workspaceLoaded,
    loadMyOrders,
    loadOrder,
    create,
    accept,
    requestOfflineInvoice,
    refreshPayment,
    confirmCompletion,
    disputeCompletion,
    reportNoStart,
    cancelOrder,
    resolveTezkor,
    resolveAgentTezkor,
    submitReview,
    submitProviderReview,
    loadAgentWorkspace,
    sendOffer,
    submitWork,
    reset,
  }
})
