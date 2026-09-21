import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type { OrderRoute } from '@/modules/orders/types/order'

/**
 * The Tender | Tezkor tab shared by Home, Live orders and the Create button.
 * Until the user picks a tab it defaults to Tender for accounts allowed to
 * create tenders and to Tezkor for everyone else. Session-only on purpose.
 */
export const useOrderRouteStore = defineStore('order-route', () => {
  const picked = ref<OrderRoute | null>(null)

  const canCreateTender = computed(() => useAuthStore().user?.can_create_tender === true)

  const tenderStatus = computed(() => useAuthStore().user?.tender_access_status ?? 'none')

  const active = computed<OrderRoute>(() =>
    picked.value ?? (canCreateTender.value ? 'tender' : 'tezkor'),
  )

  /** Tender tab selected but the account may not create tenders. */
  const tenderLocked = computed(() => active.value === 'tender' && !canCreateTender.value)

  function set(route: OrderRoute) {
    picked.value = route
  }

  return { picked, active, canCreateTender, tenderStatus, tenderLocked, set }
})
