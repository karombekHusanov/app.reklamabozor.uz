import type { RouteRecordRaw } from 'vue-router'
import { ROUTES } from '@/modules/shell/constants/routes'

export const mapRoutes: RouteRecordRaw[] = [
  {
    path: ROUTES.map,
    name: 'map',
    component: () => import('@/modules/map/pages/MapPage.vue'),
  },
]
