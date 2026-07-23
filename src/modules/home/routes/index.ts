import type { RouteRecordRaw } from 'vue-router'

export const homeRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'home',
    component: () => import('@/modules/home/pages/HomePage.vue'),
  },
  {
    path: 'live-orders',
    name: 'live-orders',
    component: () => import('@/modules/home/pages/LiveOrdersPage.vue'),
  },
]
