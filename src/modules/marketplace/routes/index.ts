import type { RouteRecordRaw } from 'vue-router'

export const marketplaceRoutes: RouteRecordRaw[] = [
  {
    path: 'agencies',
    name: 'agencies',
    component: () => import('@/modules/marketplace/pages/AgenciesPage.vue'),
  },
  {
    path: 'agents/:id',
    name: 'agent-detail',
    component: () => import('@/modules/marketplace/pages/AgentDetailPage.vue'),
    props: true,
  },
  {
    path: 'agents/:id/portfolio/:itemId',
    name: 'agent-portfolio-detail',
    component: () => import('@/modules/marketplace/pages/AgentPortfolioDetailPage.vue'),
    props: true,
  },
]
