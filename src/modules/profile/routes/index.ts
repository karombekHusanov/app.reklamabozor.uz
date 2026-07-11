import type { RouteRecordRaw } from 'vue-router'

export const profileRoutes: RouteRecordRaw[] = [
  {
    path: 'profile/edit',
    name: 'profile-edit',
    component: () => import('@/modules/profile/pages/ProfileEditPage.vue'),
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
