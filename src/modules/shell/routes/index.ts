import type { RouteRecordRaw } from 'vue-router'
import { ROUTES } from '@/modules/shell/constants/routes'
import { agentRoutes } from '@/modules/agent/routes'
import { assistantRoutes } from '@/modules/assistant/routes'
import { chatRoutes } from '@/modules/chat/routes'
import { homeRoutes } from '@/modules/home/routes'
import { mapRoutes } from '@/modules/map/routes'
import { notificationsRoutes } from '@/modules/notifications'
import { marketplaceRoutes } from '@/modules/marketplace/routes'
import { ordersRoutes } from '@/modules/orders'
import { productsRoutes } from '@/modules/products/routes'
import { profileRoutes } from '@/modules/profile/routes'
import { tenderRoutes } from '@/modules/tender'
import { legalRoutes } from '@/modules/legal'

export const shellRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/modules/shell/layouts/AppLayout.vue'),
    children: [
      ...homeRoutes,
      ...agentRoutes,
      ...marketplaceRoutes,
      // Designer role retired (2026-10-14): keep the old deep link alive.
      { path: 'designers', redirect: ROUTES.agencies },
      ...tenderRoutes,
      ...mapRoutes,
      ...chatRoutes,
      ...notificationsRoutes,
      ...ordersRoutes,
      ...productsRoutes,
      ...assistantRoutes,
      ...profileRoutes,
      ...legalRoutes,
    ],
  },
]
