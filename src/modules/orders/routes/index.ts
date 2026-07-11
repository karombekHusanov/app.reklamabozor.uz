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
    // The wizard has its own bottom Back/Continue bar — hide the global tab bar.
    meta: { hideTabBar: true },
  },
  {
    path: 'offers',
    name: 'offers',
    component: () => import('@/modules/orders/pages/OffersPage.vue'),
    meta: { hideTabBar: true },
  },
  {
    path: 'orders/:id',
    name: 'order-detail',
    component: () => import('@/modules/orders/pages/OrderDetailPage.vue'),
    props: true,
  },
]
