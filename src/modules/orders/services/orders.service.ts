import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { Category } from '@/modules/agent/types/agent'
import type {
  AgentOffer,
  AgentOrder,
  CreateOfferPayload,
  CreateOrderPayload,
  Offer,
  Order,
} from '@/modules/orders/types/order'

/** Active categories, optionally filtered by service type. */
export async function fetchCategories(type?: 'agent' | 'designer'): Promise<Category[]> {
  const { data } = await api.get<ApiSuccess<Category[]>>('/api/v1/categories', {
    params: type ? { type } : undefined,
  })

  return data.data
}

// --- Client -----------------------------------------------------------------

export async function fetchMyOrders(): Promise<Order[]> {
  const { data } = await api.get<ApiSuccess<Order[]>>('/api/v1/orders')

  return data.data
}

export async function fetchOrder(id: number): Promise<Order> {
  const { data } = await api.get<ApiSuccess<Order>>(`/api/v1/orders/${id}`)

  return data.data
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await api.post<ApiSuccess<Order>>('/api/v1/orders', payload)

  return data.data
}

export async function acceptOffer(offerId: number): Promise<Offer> {
  const { data } = await api.post<ApiSuccess<Offer>>(`/api/v1/offers/${offerId}/accept`)

  return data.data
}

// --- Agent ------------------------------------------------------------------

export async function fetchAgentOrders(): Promise<AgentOrder[]> {
  const { data } = await api.get<ApiSuccess<AgentOrder[]>>('/api/v1/agent/orders')

  return data.data
}

export async function submitOffer(orderId: number, payload: CreateOfferPayload): Promise<Offer> {
  const { data } = await api.post<ApiSuccess<Offer>>(
    `/api/v1/agent/orders/${orderId}/offers`,
    payload,
  )

  return data.data
}

export async function fetchAgentOffers(): Promise<AgentOffer[]> {
  const { data } = await api.get<ApiSuccess<AgentOffer[]>>('/api/v1/agent/offers')

  return data.data
}
