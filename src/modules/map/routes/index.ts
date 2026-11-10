import type { RouteRecordRaw } from 'vue-router'
import { ROUTES } from '@/modules/shell/constants/routes'

export const mapRoutes: RouteRecordRaw[] = [
  {
    path: ROUTES.map,
    name: 'map',
    meta: { hideTabBar: true },
    component: () => import('@/modules/map/pages/MapPage.vue'),
  },
  {
    path: ROUTES.metroAds,
    name: 'metro-ads',
    meta: { hideTabBar: true },
    component: () => import('@/modules/placements/pages/MetroAdsPage.vue'),
  },
  {
    path: ROUTES.placementCalculator,
    name: 'placement-calculator',
    meta: { hideTabBar: true },
    component: () => import('@/modules/placements/pages/PlacementCalculatorPage.vue'),
  },
]
