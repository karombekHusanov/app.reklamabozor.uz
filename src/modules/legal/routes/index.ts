import type { RouteRecordRaw } from 'vue-router'

export const legalRoutes: RouteRecordRaw[] = [
  {
    path: 'legal/public-offer',
    name: 'public-offer',
    meta: { hideTabBar: true },
    component: () => import('@/modules/legal/pages/PublicOfferPage.vue'),
  },
  {
    path: 'legal/agent-offer',
    name: 'agent-offer',
    meta: { hideTabBar: true, offerKind: 'agent' },
    component: () => import('@/modules/legal/pages/PublicOfferPage.vue'),
  },
]
