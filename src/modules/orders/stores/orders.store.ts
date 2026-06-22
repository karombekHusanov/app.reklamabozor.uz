import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getApiErrorMessage } from '@/core/api/api-error'
import {
  acceptOffer as acceptOfferRequest,
  createOrder as createOrderRequest,
  fetchAgentOffers,
  fetchAgentOrders,
  fetchMyOrders,
  fetchOrder,
  submitOffer as submitOfferRequest,
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

  async function loadMyOrders() {
    isLoading.value = true
    error.value = null
    try {
      myOrders.value = await fetchMyOrders()
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

  async function loadAgentWorkspace() {
    isLoadingAgent.value = true
    error.value = null
    try {
      const [orders, offers] = await Promise.all([fetchAgentOrders(), fetchAgentOffers()])
      availableOrders.value = orders
      myOffers.value = offers
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
      await loadAgentWorkspace()
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
    loadAgentWorkspace,
    sendOffer,
    reset,
  }
})
