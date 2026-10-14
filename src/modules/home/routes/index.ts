import type { RouteRecordRaw } from 'vue-router'
import { ROUTES } from '@/modules/shell/constants/routes'

export const homeRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'home',
    // No footer on the client home — the fixed "tell us about your task" action replaces it.
    meta: { mode: 'client', hideTabBar: true },
    component: () => import('@/modules/home/pages/HomePage.vue'),
  },
  {
    // The open-order feed lives on the agent home now.
    path: 'live-orders',
    redirect: ROUTES.agentHome,
  },
  {
    // Old bot links to the pre-redesign Business workspace.
    path: 'business',
    redirect: ROUTES.agentHome,
  },
  {
    // A request as an agency sees it (bot "new order" links land here).
    path: 'live-orders/:id',
    name: 'live-order-detail',
    meta: { mode: 'agent' },
    component: () => import('@/modules/home/pages/LiveOrderDetailPage.vue'),
    props: true,
  },
]
