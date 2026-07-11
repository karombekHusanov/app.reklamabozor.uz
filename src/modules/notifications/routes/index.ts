import type { RouteRecordRaw } from 'vue-router'
import { ROUTES } from '@/modules/shell/constants/routes'

export const notificationsRoutes: RouteRecordRaw[] = [
  {
    path: ROUTES.notifications,
    name: 'notifications',
    component: () => import('@/modules/notifications/pages/NotificationsPage.vue'),
    meta: { hideTabBar: true },
  },
]
