import type { RouteRecordRaw } from 'vue-router'

export const profileRoutes: RouteRecordRaw[] = [
  {
    path: 'clients/:id',
    name: 'client-detail',
    meta: { hideTabBar: true },
    component: () => import('@/modules/profile/pages/ClientDetailPage.vue'),
    props: true,
  },
  {
    path: 'profile/edit',
    name: 'profile-edit',
    component: () => import('@/modules/profile/pages/ProfileEditPage.vue'),
  },
  {
    path: 'earnings',
    name: 'earnings',
    meta: { hideTabBar: true },
    component: () => import('@/modules/profile/pages/EarningsPage.vue'),
  },
  {
    // Propusk card payment (ATMOS): card → SMS code → done. Own sticky pay bar.
    path: 'propusk/pay',
    name: 'propusk-pay',
    meta: { hideTabBar: true },
    component: () => import('@/modules/agent/pages/PropuskPayPage.vue'),
  },
  {
    path: 'profile',
    name: 'profile',
    component: () => import('@/modules/profile/pages/ProfilePage.vue'),
  },
  {
    path: 'settings',
    name: 'settings',
    component: () => import('@/modules/profile/pages/ProfileSettingsPage.vue'),
  },
]
