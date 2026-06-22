import type { RouteRecordRaw } from 'vue-router'

export const agentRoutes: RouteRecordRaw[] = [
  {
    path: 'agent',
    name: 'agent-hub',
    component: () => import('@/modules/agent/pages/AgentHubPage.vue'),
  },
]
