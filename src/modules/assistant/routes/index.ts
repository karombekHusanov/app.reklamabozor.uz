import type { RouteRecordRaw } from 'vue-router'

export const assistantRoutes: RouteRecordRaw[] = [
  {
    // Tab root for the upcoming AI assistant. Currently a "coming soon" page.
    path: 'assistant',
    name: 'assistant',
    component: () => import('@/modules/assistant/pages/AssistantPage.vue'),
  },
]
