export const ROUTES = {
  home: '/',
  liveOrders: '/live-orders',
  marketplace: '/marketplace',
  agencies: '/agencies',
  agentPortfolio: (agentId: number | string, itemId: number | string) =>
    `/agents/${agentId}/portfolio/${itemId}`,
  products: '/products',
  designers: '/designers',
  map: '/map',
  chat: '/chat',
  chatThreads: '/chat/threads',
  chatDirect: (id: number | string) => `/chat/direct/${id}`,
  chatOrder: (id: number | string) => `/chat/${id}`,
  notifications: '/notifications',
  orders: '/orders',
  offers: '/offers',
  newOrder: '/orders/new',
  profile: '/profile', // personal account only (tab)
  profileEdit: '/profile/edit',
  clientDetail: (id: number | string) => `/clients/${id}`,
  settings: '/settings',
} as const
