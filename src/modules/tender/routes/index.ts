import type { RouteRecordRaw } from 'vue-router'
import { ROUTES } from '@/modules/shell/constants/routes'

export const tenderRoutes: RouteRecordRaw[] = [
  {
    path: ROUTES.tender,
    name: 'tender',
    component: () => import('@/modules/tender/pages/TenderPage.vue'),
  },
]
