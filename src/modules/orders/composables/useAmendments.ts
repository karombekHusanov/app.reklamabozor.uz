import { computed, ref } from 'vue'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { getApiErrorMessage } from '@/core/api/api-error'
import {
  approveAmendment,
  cancelAmendment,
  fetchAmendmentDocument,
  fetchAmendments,
  previewAmendment,
  proposeAmendment,
  rejectAmendment,
} from '@/modules/orders/services/orders.service'
import type { Amendment, AmendmentDocument, AmendmentInput } from '@/modules/orders/types/order'

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

  /** Addendum text currently shown in the accept drawer. */
  const document = ref<AmendmentDocument | null>(null)
  const documentLoading = ref(false)
  const documentError = ref<string | null>(null)

  /** Build the addendum from draft rows (before anything is stored). */
  async function preview(orderId: number, payload: AmendmentInput): Promise<boolean> {
    document.value = null
    documentError.value = null
    documentLoading.value = true
    try {
      document.value = await previewAmendment(orderId, payload)
      return true
    }
    catch (e) {
      documentError.value = getApiErrorMessage(e)
      return false
    }
    finally {
      documentLoading.value = false
    }
  }

  /** Load the stored addendum's text before approving it. */
  async function loadDocument(amendmentId: number): Promise<boolean> {
    document.value = null
    documentError.value = null
    documentLoading.value = true
    try {
      document.value = await fetchAmendmentDocument(amendmentId)
      return true
    }
    catch (e) {
      documentError.value = getApiErrorMessage(e)
      return false
    }
    finally {
      documentLoading.value = false
    }
  }

  /**
   * The single proposal still awaiting decisions. Only `pending` counts — the
   * backend blocks a new proposal on exactly that, and `approved` is a legacy
   * state (an old amendment parked on its extra payment).
   */
  const openAmendment = computed(() =>
    amendments.value.find(a => a.status === 'pending') ?? null,
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

  async function approve(id: number, documentHash?: string | null): Promise<boolean> {
    if (submitting.value) return false
    submitting.value = true
    try {
      upsert(await approveAmendment(id, documentHash))
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

  return {
    amendments,
    openAmendment,
    loading,
    submitting,
    document,
    documentLoading,
    documentError,
    load,
    preview,
    loadDocument,
    propose,
    approve,
    reject,
    cancel,
  }
}
