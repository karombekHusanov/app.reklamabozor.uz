import type { RouteRecordRaw } from 'vue-router'
import { ROUTES } from '@/modules/shell/constants/routes'

/** Agent workspace roots — `meta.mode` switches the shell to the agent footer. */
export const agentRoutes: RouteRecordRaw[] = [
  {
    path: ROUTES.agentHome.slice(1),
    name: 'agent-home',
    meta: { mode: 'agent' },
    component: () => import('@/modules/agent/pages/AgentHomePage.vue'),
  },
  {
    path: ROUTES.agentChats.slice(1),
    name: 'agent-chats',
    meta: { mode: 'agent' },
    component: () => import('@/modules/agent/pages/AgentChatsPage.vue'),
  },
  {
    path: ROUTES.agentBalance.slice(1),
    name: 'agent-balance',
    meta: { mode: 'agent' },
    component: () => import('@/modules/agent/pages/AgentBalancePage.vue'),
  },
  {
    path: ROUTES.agentProfile.slice(1),
    name: 'agent-profile',
    meta: { mode: 'agent' },
    component: () => import('@/modules/agent/pages/AgentAnketaPage.vue'),
  },
  {
    path: ROUTES.agentHelp.slice(1),
    name: 'agent-help',
    meta: { mode: 'agent' },
    component: () => import('@/modules/agent/pages/AgentHelpPage.vue'),
  },
]
