import { computed, ref } from 'vue'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { getApiErrorMessage } from '@/core/api/api-error'
import {
  approveAmendment,
  cancelAmendment,
  fetchAmendments,
  proposeAmendment,
  rejectAmendment,
} from '@/modules/orders/services/orders.service'
import type { Amendment, AmendmentInput } from '@/modules/orders/types/order'

/**
 * Shared state + actions for the "Additional agreement" (Qo'shimcha kelishuv)
 * flow. Used by both the client (OrderDetailPage) and the agent (OfferDetailPage);
 * the backend's `can_approve` / `can_cancel` flags drive which buttons show.
 */
export function useAmendments() {
  const toast = useToast()
  const locale = useLocaleStore()

  const amendments = ref<Amendment[]>([])
  const loading = ref(false)
  const submitting = ref(false)

  /** The single open (pending/approved-awaiting-payment) amendment, if any. */
  const openAmendment = computed(() =>
    amendments.value.find(a => a.status === 'pending' || a.status === 'approved') ?? null,
  )

  async function load(orderId: number) {
    loading.value = true
    try {
      amendments.value = await fetchAmendments(orderId)
    }
    catch {
      // A silent failure keeps the order page usable; the section just stays empty.
      amendments.value = []
    }
    finally {
      loading.value = false
    }
  }

  function upsert(a: Amendment) {
    const i = amendments.value.findIndex(x => x.id === a.id)
    if (i === -1) amendments.value.unshift(a)
    else amendments.value[i] = a
  }

  async function propose(orderId: number, payload: AmendmentInput): Promise<boolean> {
    if (submitting.value) return false
    submitting.value = true
    try {
      upsert(await proposeAmendment(orderId, payload))
      toast.success(locale.t.amendments.proposedToast)
      return true
    }
    catch (e) {
      toast.error(getApiErrorMessage(e))
      return false
    }
    finally {
      submitting.value = false
    }
  }

  async function approve(id: number): Promise<boolean> {
    if (submitting.value) return false
    submitting.value = true
    try {
      upsert(await approveAmendment(id))
      toast.success(locale.t.amendments.approvedToast)
      return true
    }
    catch (e) {
      toast.error(getApiErrorMessage(e))
      return false
    }
    finally {
      submitting.value = false
    }
  }

  async function reject(id: number, reason?: string): Promise<boolean> {
    if (submitting.value) return false
    submitting.value = true
    try {
      upsert(await rejectAmendment(id, reason))
      toast.success(locale.t.amendments.rejectedToast)
      return true
    }
    catch (e) {
      toast.error(getApiErrorMessage(e))
      return false
    }
    finally {
      submitting.value = false
    }
  }

  async function cancel(id: number): Promise<boolean> {
    if (submitting.value) return false
    submitting.value = true
    try {
      upsert(await cancelAmendment(id))
      toast.success(locale.t.amendments.cancelledToast)
      return true
    }
    catch (e) {
      toast.error(getApiErrorMessage(e))
      return false
    }
    finally {
      submitting.value = false
    }
  }

  return { amendments, openAmendment, loading, submitting, load, propose, approve, reject, cancel }
}
