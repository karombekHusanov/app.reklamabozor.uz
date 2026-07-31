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
