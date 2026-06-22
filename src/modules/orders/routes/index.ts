import type { RouteRecordRaw } from 'vue-router'

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
  },
  {
    path: 'orders/:id',
    name: 'order-detail',
    component: () => import('@/modules/orders/pages/OrderDetailPage.vue'),
    props: true,
  },
]
