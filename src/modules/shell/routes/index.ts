import type { RouteRecordRaw } from 'vue-router'
import { agentRoutes } from '@/modules/agent/routes'
import { chatRoutes } from '@/modules/chat/routes'
import { designersRoutes } from '@/modules/designers'
import { homeRoutes } from '@/modules/home/routes'
import { mapRoutes } from '@/modules/map/routes'
import { marketplaceRoutes } from '@/modules/marketplace/routes'
import { ordersRoutes } from '@/modules/orders'
import { productsRoutes } from '@/modules/products/routes'
import { profileRoutes } from '@/modules/profile/routes'

export const shellRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/modules/shell/layouts/AppLayout.vue'),
    children: [
      ...homeRoutes,
      ...marketplaceRoutes,
      ...designersRoutes,
      ...mapRoutes,
      ...chatRoutes,
      ...ordersRoutes,
      ...agentRoutes,
      ...productsRoutes,
      ...profileRoutes,
    ],
  },
]
