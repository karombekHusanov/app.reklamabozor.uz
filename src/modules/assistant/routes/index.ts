import type { RouteRecordRaw } from 'vue-router'

export const assistantRoutes: RouteRecordRaw[] = [
  {
    // Full-screen chat: the tab bar would eat the composer's room and the
    // conversation is a place you enter, not a surface you skim.
    path: 'assistant',
    name: 'assistant',
    meta: { hideTabBar: true },
    component: () => import('@/modules/assistant/pages/AssistantPage.vue'),
  },
]
