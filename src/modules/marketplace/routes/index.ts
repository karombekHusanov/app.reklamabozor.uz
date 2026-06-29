import type { RouteRecordRaw } from 'vue-router'

export const marketplaceRoutes: RouteRecordRaw[] = [
  {
    path: 'marketplace',
    name: 'marketplace',
    component: () => import('@/modules/marketplace/pages/MarketplacePage.vue'),
  },
  {
    path: 'agents/:id',
    name: 'agent-detail',
    component: () => import('@/modules/marketplace/pages/AgentDetailPage.vue'),
    props: true,
  },
]
