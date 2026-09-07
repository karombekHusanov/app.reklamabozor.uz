import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AssistantDraft } from '@/modules/assistant/types/assistant'

/**
 * Hand-off between the assistant and the request form: the assistant stores a
 * draft, the form consumes it once. Session-only on purpose — a stale draft
 * silently pre-filling a later order would be worse than no draft.
 */
export const useOrderDraftStore = defineStore('order-draft', () => {
  const draft = ref<AssistantDraft | null>(null)

  function set(value: AssistantDraft) {
    draft.value = value
  }

  /** Read and clear — the form only ever applies a draft once. */
  function consume(): AssistantDraft | null {
    const value = draft.value
    draft.value = null

    return value
  }

  return { draft, set, consume }
})
