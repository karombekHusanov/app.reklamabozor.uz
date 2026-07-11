import type { RouteRecordRaw } from 'vue-router'
import { ROUTES } from '@/modules/shell/constants/routes'

export const chatRoutes: RouteRecordRaw[] = [
  {
    // The Chat tab IS the community-wide chat — open it directly, no intermediate list.
    path: ROUTES.chat,
    name: 'chat',
    component: () => import('@/modules/chat/pages/GlobalChatPage.vue'),
    meta: { hideTabBar: true },
  },
  {
    // Order-thread inbox — static segment, declared before the :orderId thread.
    path: 'chat/threads',
    name: 'chat-threads',
    component: () => import('@/modules/chat/pages/ChatPage.vue'),
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
