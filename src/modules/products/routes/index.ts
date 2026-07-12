import type { RouteRecordRaw } from 'vue-router'

export const productsRoutes: RouteRecordRaw[] = [
  {
    path: 'products',
    name: 'products',
    component: () => import('@/modules/products/pages/ProductsPage.vue'),
  },
  {
    // Reserved for the upcoming marketplace product feature; product banners
    // link here. Currently shows a "coming soon" placeholder.
    path: 'products/:id',
    name: 'product-detail',
    component: () => import('@/modules/products/pages/ProductDetailPage.vue'),
    props: true,
  },
]
