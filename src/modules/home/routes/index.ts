import type { RouteRecordRaw } from 'vue-router'

export const homeRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'home',
    // No footer on the client home — the fixed "tell us about your task" action replaces it.
    meta: { mode: 'client', hideTabBar: true },
    component: () => import('@/modules/home/pages/HomePage.vue'),
  },
  {
    path: 'live-orders',
    name: 'live-orders',
    component: () => import('@/modules/home/pages/LiveOrdersPage.vue'),
  },
  {
    path: 'live-orders/:id',
    name: 'live-order-detail',
    component: () => import('@/modules/home/pages/LiveOrderDetailPage.vue'),
    props: true,
  },
]
