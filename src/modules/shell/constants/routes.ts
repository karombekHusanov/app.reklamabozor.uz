export const ROUTES = {
  home: '/',
  marketplace: '/marketplace',
  agencies: '/agencies',
  products: '/products',
  designers: '/designers',
  map: '/map',
  chat: '/chat',
  chatThreads: '/chat/threads',
  notifications: '/notifications',
  orders: '/orders',
  offers: '/offers',
  newOrder: '/orders/new',
  profile: '/profile', // personal account only (tab)
  profileEdit: '/profile/edit',
  clientDetail: (id: number | string) => `/clients/${id}`,
  settings: '/settings',
} as const
