import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import { nextTick } from 'vue'
import { ROUTES } from '@/modules/shell/constants/routes'
import { shellRoutes } from '@/modules/shell/routes'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useModeStore } from '@/modules/shell/stores/mode.store'

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

// Workspace gate, resolved before anything renders (auth settles first — the
// bootstrap promise is shared): non-providers never land on agent pages, and a
// cold start on the client home honours a saved Agent choice.
router.beforeEach(async (to, from) => {
  if (!to.meta.mode) return
  const auth = useAuthStore()
  await auth.bootstrapTelegramAuth().catch(() => false)
  const mode = useModeStore()
  if (to.meta.mode === 'agent' && auth.isAuthenticated && !mode.canUseAgent) return ROUTES.home
  if (to.meta.mode === 'client' && from === START_LOCATION && mode.isAgent) return ROUTES.agentHome
})

// A page's `meta.mode` decides the workspace. A cold start on the client home is
// only the default landing, so it must not overwrite the saved choice.
router.afterEach((to, from) => {
  const target = to.meta.mode
  if (!target || (from === START_LOCATION && target === 'client')) return
  useModeStore().set(target)
})

export default router
