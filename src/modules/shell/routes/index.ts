import type { RouteRecordRaw } from 'vue-router'
import { agentRoutes } from '@/modules/agent/routes'
import { assistantRoutes } from '@/modules/assistant/routes'
import { chatRoutes } from '@/modules/chat/routes'
import { designersRoutes } from '@/modules/designers'
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
      ...designersRoutes,
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
