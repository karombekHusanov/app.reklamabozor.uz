import type { RouteRecordRaw } from 'vue-router'
import { ROUTES } from '@/modules/shell/constants/routes'

export const chatRoutes: RouteRecordRaw[] = [
  {
    path: ROUTES.chat,
    name: 'chat',
    component: () => import('@/modules/chat/pages/ChatPage.vue'),
  },
]
