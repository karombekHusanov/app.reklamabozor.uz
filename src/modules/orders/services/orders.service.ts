import { api } from '@/core/api/client'
import { mapUserRatingRow, pickUserRatingRow } from '@/core/lib/rating'
import type { ApiSuccess } from '@/core/types/api'
import type { Category } from '@/modules/agent/types/agent'
import type {
  AcceptOfferResult,
  AgentOffer,
  AgentOfferDetail,
  AgentOrder,
  CreateOfferPayload,
  CreateOrderPayload,
  Amendment,
  AmendmentInput,
  Offer,
  Order,
  OrderReview,
  Payment,
  PricelistItemInput,
  RatingInfo,
  ReviewCriterionDef,
  ReviewCriterionScore,
  UserRatingRow,
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

/** Own stars/grade for the active role (API returns a collection). */
export async function fetchMyRating(role?: string): Promise<RatingInfo | null> {
  const { data } = await api.get<ApiSuccess<UserRatingRow[]>>('/api/v1/me/rating', {
    params: role ? { role } : undefined,
  })

  const row = pickUserRatingRow(data.data ?? [], role)
  return row ? mapUserRatingRow(row) : null
}

// --- Agent ------------------------------------------------------------------

export async function fetchAgentOrders(): Promise<AgentOrder[]> {
  const { data } = await api.get<ApiSuccess<AgentOrder[]>>('/api/v1/agent/orders')

  return data.data
}

/** Single open opportunity the agent may bid on. */
export async function fetchAgentOrder(orderId: number): Promise<AgentOrder> {
  const { data } = await api.get<ApiSuccess<AgentOrder>>(`/api/v1/agent/orders/${orderId}`)

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

/** Single offer owned by the agent (detail page). */
export async function fetchAgentOffer(offerId: number): Promise<AgentOfferDetail> {
  const { data } = await api.get<ApiSuccess<AgentOfferDetail>>(`/api/v1/agent/offers/${offerId}`)

  return data.data
}

/** Open (or return) direct chat with the client from a pending offer. */
export async function openOfferChat(offerId: number): Promise<{ id: number }> {
  const { data } = await api.post<ApiSuccess<{ id: number }>>(`/api/v1/agent/offers/${offerId}/chat`)

  return data.data
}

/** Adjust pending offer price (max 5 edits). */
export async function updateOfferPrice(
  offerId: number,
  payload: { price: number, comment?: string | null },
): Promise<AgentOfferDetail> {
  const { data } = await api.patch<ApiSuccess<AgentOfferDetail>>(
    `/api/v1/agent/offers/${offerId}`,
    payload,
  )

  return data.data
}

/** Agent sends (or replaces) the pricelist on a pending offer — the priced contract step. */
export async function setOfferPricelist(
  offerId: number,
  items: PricelistItemInput[],
  deadlineDays: number,
): Promise<AgentOfferDetail> {
  const { data } = await api.put<ApiSuccess<AgentOfferDetail>>(
    `/api/v1/agent/offers/${offerId}/pricelist`,
    { items, deadline_days: deadlineDays },
  )

  return data.data
}

// --- Additional agreements (Qo'shimcha kelishuv) --------------------------

/** All amendments on an order (client, agent, or admin view). */
export async function fetchAmendments(orderId: number): Promise<Amendment[]> {
  const { data } = await api.get<ApiSuccess<Amendment[]>>(`/api/v1/orders/${orderId}/amendments`)

  return data.data
}

/** Either party proposes a change to the active deal's pricelist + deadline. */
export async function proposeAmendment(orderId: number, payload: AmendmentInput): Promise<Amendment> {
  const { data } = await api.post<ApiSuccess<Amendment>>(
    `/api/v1/orders/${orderId}/amendments`,
    payload,
  )

  return data.data
}

/** Record the current user's approval of an amendment. */
export async function approveAmendment(amendmentId: number): Promise<Amendment> {
  const { data } = await api.post<ApiSuccess<Amendment>>(`/api/v1/amendments/${amendmentId}/approve`)

  return data.data
}

/** Decline an amendment (client, agent, or operator). */
export async function rejectAmendment(amendmentId: number, reason?: string): Promise<Amendment> {
  const { data } = await api.post<ApiSuccess<Amendment>>(
    `/api/v1/amendments/${amendmentId}/reject`,
    reason ? { reason } : {},
  )

  return data.data
}

/** Initiator withdraws their own pending amendment. */
export async function cancelAmendment(amendmentId: number): Promise<Amendment> {
  const { data } = await api.post<ApiSuccess<Amendment>>(`/api/v1/amendments/${amendmentId}/cancel`)

  return data.data
}

/** Winning agent marks the work as delivered (awaits client confirmation). */
export async function submitWork(orderId: number): Promise<Order> {
  const { data } = await api.post<ApiSuccess<Order>>(`/api/v1/agent/orders/${orderId}/submit-work`)

  return data.data
}
