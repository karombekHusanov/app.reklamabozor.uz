import { createRouter, createWebHistory } from 'vue-router'
import { ROUTES } from '@/modules/shell/constants/routes'
import { shellRoutes } from '@/modules/shell/routes'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...shellRoutes,
    {
      path: '/:pathMatch(.*)*',
      redirect: ROUTES.home,
    },
  ],
})

export default router
