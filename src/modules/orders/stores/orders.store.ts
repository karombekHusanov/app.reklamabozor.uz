import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getApiErrorMessage } from '@/core/api/api-error'
import {
  acceptOffer as acceptOfferRequest,
  confirmCompletion as confirmCompletionRequest,
  createOrder as createOrderRequest,
  disputeCompletion as disputeCompletionRequest,
  fetchAgentOffers,
  fetchAgentOrders,
  fetchMyOrders,
  fetchOrder,
  submitOffer as submitOfferRequest,
  submitReview as submitReviewRequest,
  submitWork as submitWorkRequest,
} from '@/modules/orders/services/orders.service'
import type {
  AgentOffer,
  AgentOrder,
  CreateOfferPayload,
  CreateOrderPayload,
  Order,
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

  async function loadMyOrders(force = false) {
    if (myOrdersLoaded.value && !force) return

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

  async function accept(offerId: number) {
    isSubmitting.value = true
    error.value = null
    try {
      await acceptOfferRequest(offerId)
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

  /** Client rates the winning agency on a completed order. */
  async function submitReview(orderId: number, rating: number, comment: string | null) {
    isSubmitting.value = true
    error.value = null
    try {
      const review = await submitReviewRequest(orderId, rating, comment)
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

  async function loadAgentWorkspace(force = false) {
    if (workspaceLoaded.value && !force) return

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
  }

  async function sendOffer(orderId: number, payload: CreateOfferPayload) {
    isSubmitting.value = true
    error.value = null
    try {
      await submitOfferRequest(orderId, payload)
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
    loadMyOrders,
    loadOrder,
    create,
    accept,
    confirmCompletion,
    disputeCompletion,
    submitReview,
    loadAgentWorkspace,
    sendOffer,
    submitWork,
    reset,
  }
})
