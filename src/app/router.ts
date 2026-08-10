import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import { ROUTES } from '@/modules/shell/constants/routes'
import { shellRoutes } from '@/modules/shell/routes'

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...shellRoutes,
    {
      path: '/:pathMatch(.*)*',
      redirect: ROUTES.home,
    },
  ],
  scrollBehavior() {
    return { top: 0, left: 0 }
  },
})

// AppLayout uses out-in page transitions — reset after the new view mounts,
// otherwise the previous page's scroll offset can stick.
router.afterEach(() => {
  scrollToTop()
  void nextTick(() => {
    scrollToTop()
    requestAnimationFrame(scrollToTop)
  })
})

export default router
