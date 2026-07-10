import type { RouteRecordRaw } from 'vue-router'
import { ROUTES } from '@/modules/shell/constants/routes'

export const chatRoutes: RouteRecordRaw[] = [
  {
    path: ROUTES.chat,
    name: 'chat',
    component: () => import('@/modules/chat/pages/ChatPage.vue'),
  },
  {
    // Community-wide chat — static segment, declared before the :orderId thread.
    path: 'chat/global',
    name: 'chat-global',
    component: () => import('@/modules/chat/pages/GlobalChatPage.vue'),
    meta: { hideTabBar: true },
  },
  {
    // One thread per order — deep-linked from bot pings (`/chat/{orderId}`).
    path: 'chat/:orderId',
    name: 'chat-thread',
    component: () => import('@/modules/chat/pages/ChatThreadPage.vue'),
    props: true,
    // The composer docks at the bottom — hide the global tab bar to avoid a clash.
    meta: { hideTabBar: true },
  },
]
