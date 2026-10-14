import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { fetchShowcaseOrder } from '@/modules/home/services/live-orders.service'
import { ROUTES } from '@/modules/shell/constants/routes'

/**
 * Legacy `/offers?order={id}` bot links (sent before the agent workspace
 * redesign): an agent with a priced or accepted offer lands on that offer's
 * deal page, everyone else on the request itself. Without `order` the old
 * Business workspace maps to the agent feed / chats.
 */
async function resolveLegacyOffers(to: RouteLocationNormalized) {
  const raw = Array.isArray(to.query.order) ? to.query.order[0] : to.query.order
  const orderId = Number(raw)
  if (!raw || !Number.isFinite(orderId)) {
    return to.query.tab === 'offers' ? ROUTES.agentChats : ROUTES.agentHome
  }

  await useAuthStore().bootstrapTelegramAuth().catch(() => false)
  try {
    const mine = (await fetchShowcaseOrder(orderId)).my_offer
    if (mine && (mine.status === 'accepted' || !mine.is_interest)) return ROUTES.offerDetail(mine.id)
  }
  catch {
    // Fall through to the request page — it renders its own error state.
  }
  return ROUTES.liveOrderDetail(orderId)
}

export const ordersRoutes: RouteRecordRaw[] = [
  {
    path: 'orders',
    name: 'orders',
    component: () => import('@/modules/orders/pages/OrdersPage.vue'),
  },
  {
    // Static route before the dynamic one so "new" isn't matched as an id.
    path: 'orders/new',
    name: 'order-new',
    component: () => import('@/modules/orders/pages/NewOrderPage.vue'),
    // The form docks its own submit button at the bottom — hide the tab bar.
    meta: { hideTabBar: true },
  },
  {
    // Legacy Business workspace — always redirects (see resolveLegacyOffers).
    path: 'offers',
    name: 'offers-legacy',
    component: { render: () => null },
    beforeEnter: resolveLegacyOffers,
  },
  {
    // Legacy opportunity page → the redesigned request page.
    path: 'offers/order/:id',
    redirect: to => ROUTES.liveOrderDetail(String(to.params.id)),
  },
  {
    path: 'offers/:id',
    name: 'offer-detail',
    component: () => import('@/modules/orders/pages/OfferDetailPage.vue'),
    props: true,
    meta: { hideTabBar: true },
  },
  {
    path: 'orders/:id',
    name: 'order-detail',
    component: () => import('@/modules/orders/pages/OrderDetailPage.vue'),
    props: true,
  },
]
