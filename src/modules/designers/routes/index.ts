import type { RouteRecordRaw } from 'vue-router'

export const designersRoutes: RouteRecordRaw[] = [
  {
    path: 'designers',
    name: 'designers',
    component: () => import('@/modules/designers/pages/DesignersPage.vue'),
  },
]
