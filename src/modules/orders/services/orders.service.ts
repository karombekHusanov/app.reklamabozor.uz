import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { Category } from '@/modules/agent/types/agent'
import type {
  AcceptOfferResult,
  AgentOffer,
  AgentOrder,
  CreateOfferPayload,
  CreateOrderPayload,
  Offer,
  Order,
  OrderReview,
  Payment,
  RatingInfo,
  ReviewCriterionDef,
  ReviewCriterionScore,
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

export async function acceptOffer(offerId: number): Promise<AcceptOfferResult> {
  const { data } = await api.post<ApiSuccess<AcceptOfferResult>>(`/api/v1/offers/${offerId}/accept`)

  return data.data
}

/** (Re)start the Multicard checkout for an order awaiting payment. */
export async function startOrderPayment(orderId: number): Promise<Payment> {
  const { data } = await api.post<ApiSuccess<Payment>>(`/api/v1/orders/${orderId}/pay`)

  return data.data
}

/** Latest payment status for an order (polled after returning from checkout). */
export async function fetchOrderPayment(orderId: number): Promise<Payment | null> {
  const { data } = await api.get<ApiSuccess<Payment | null>>(`/api/v1/orders/${orderId}/payment`)

  return data.data
}

/** Client accepts the delivered work — the order completes. */
export async function confirmCompletion(orderId: number): Promise<Order> {
  const { data } = await api.post<ApiSuccess<Order>>(`/api/v1/orders/${orderId}/complete`)

  return data.data
}

/** Client rejects the delivered work — the ops team steps in. */
export async function disputeCompletion(orderId: number): Promise<Order> {
  const { data } = await api.post<ApiSuccess<Order>>(`/api/v1/orders/${orderId}/dispute`)

  return data.data
}

/** Client cancels their own order — only while it is still open for offers. */
export async function cancelOrder(orderId: number): Promise<Order> {
  const { data } = await api.post<ApiSuccess<Order>>(`/api/v1/orders/${orderId}/cancel`)

  return data.data
}

/** Fetch the criteria catalog for a given reviewer role. */
export async function fetchReviewCriteria(role: 'agent' | 'designer' | 'client'): Promise<ReviewCriterionDef[]> {
  const { data } = await api.get<ApiSuccess<ReviewCriterionDef[]>>('/api/v1/review-criteria', {
    params: { role },
  })

  return data.data
}

/** Client rates the winning agency on a completed order (criteria-based). */
export async function submitReview(
  orderId: number,
  criteria: ReviewCriterionScore[],
  comment: string | null,
): Promise<OrderReview> {
  const { data } = await api.post<ApiSuccess<OrderReview>>(`/api/v1/orders/${orderId}/review`, {
    criteria,
    comment,
  })

  return data.data
}

/** Provider rates the client on a completed order (criteria-based). */
export async function submitProviderReview(
  orderId: number,
  criteria: ReviewCriterionScore[],
  comment: string | null,
): Promise<OrderReview> {
  const { data } = await api.post<ApiSuccess<OrderReview>>(`/api/v1/agent/orders/${orderId}/review`, {
    criteria,
    comment,
  })

  return data.data
}

/** Fetch both reviews for an order (client + provider). */
export async function fetchOrderReviews(orderId: number): Promise<OrderReview[]> {
  const { data } = await api.get<ApiSuccess<OrderReview[]>>(`/api/v1/orders/${orderId}/reviews`)

  return data.data
}

/** Own stars/grade for the active role. */
export async function fetchMyRating(role?: string): Promise<RatingInfo> {
  const { data } = await api.get<ApiSuccess<RatingInfo>>('/api/v1/me/rating', {
    params: role ? { role } : undefined,
  })

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

/** Winning agent marks the work as delivered (awaits client confirmation). */
export async function submitWork(orderId: number): Promise<Order> {
  const { data } = await api.post<ApiSuccess<Order>>(`/api/v1/agent/orders/${orderId}/submit-work`)

  return data.data
}
