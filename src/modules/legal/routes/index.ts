import type { RouteRecordRaw } from 'vue-router'

export const legalRoutes: RouteRecordRaw[] = [
  {
    path: 'legal/public-offer',
    name: 'public-offer',
    meta: { hideTabBar: true },
    component: () => import('@/modules/legal/pages/PublicOfferPage.vue'),
  },
]
