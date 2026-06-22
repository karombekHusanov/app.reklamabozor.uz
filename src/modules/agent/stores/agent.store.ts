import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getApiErrorMessage } from '@/core/api/api-error'
import {
  fetchAgentCategories,
  fetchMyAgentProfile,
  resubmitAgentApplication,
  submitAgentApplication,
  updateAgentDetails,
} from '@/modules/agent/services/agent.service'
import type {
  AgentApplicationPayload,
  AgentDetailsPayload,
  AgentProfile,
  Category,
} from '@/modules/agent/types/agent'

export const useAgentStore = defineStore('agent', () => {
  const profile = ref<AgentProfile | null>(null)
  const categories = ref<Category[]>([])

  const isLoadingProfile = ref(false)
  const isLoadingCategories = ref(false)
  const isSubmitting = ref(false)
  const isSavingDetails = ref(false)
  const error = ref<string | null>(null)
  const loaded = ref(false)

  const status = computed(() => profile.value?.status ?? null)
  const hasProfile = computed(() => profile.value !== null)
  const isApproved = computed(() => status.value === 'approved')
  const isPending = computed(() => status.value === 'pending')
  const isRejected = computed(() => status.value === 'rejected')
  /** A user can fill the application form when they have no profile yet, or were rejected. */
  const canApply = computed(() => !hasProfile.value || isRejected.value)
  /** Phase-2 presentation completeness (0–100), only meaningful once approved. */
  const completion = computed(() => profile.value?.completion_percent ?? 0)

  async function loadProfile(force = false) {
    if (loaded.value && !force) {
      return profile.value
    }

    isLoadingProfile.value = true
    error.value = null

    try {
      profile.value = await fetchMyAgentProfile()
      loaded.value = true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
    }
    finally {
      isLoadingProfile.value = false
    }

    return profile.value
  }

  async function loadCategories() {
    if (categories.value.length > 0) {
      return categories.value
    }

    isLoadingCategories.value = true

    try {
      categories.value = await fetchAgentCategories()
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
    }
    finally {
      isLoadingCategories.value = false
    }

    return categories.value
  }

  async function submit(payload: AgentApplicationPayload) {
    isSubmitting.value = true
    error.value = null

    try {
      // PUT when a profile already exists (editing a pending or resubmitting a rejected
      // application); POST for a brand-new application.
      profile.value = hasProfile.value
        ? await resubmitAgentApplication(payload)
        : await submitAgentApplication(payload)
      loaded.value = true
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  /** Phase 2 — save the client-facing presentation (approved profiles only). */
  async function submitDetails(payload: AgentDetailsPayload) {
    isSavingDetails.value = true
    error.value = null

    try {
      profile.value = await updateAgentDetails(payload)
      loaded.value = true
      return true
    }
    catch (e) {
      error.value = getApiErrorMessage(e)
      return false
    }
    finally {
      isSavingDetails.value = false
    }
  }

  function reset() {
    profile.value = null
    categories.value = []
    loaded.value = false
    error.value = null
  }

  return {
    profile,
    categories,
    isLoadingProfile,
    isLoadingCategories,
    isSubmitting,
    isSavingDetails,
    error,
    loaded,
    status,
    hasProfile,
    isApproved,
    isPending,
    isRejected,
    canApply,
    completion,
    loadProfile,
    loadCategories,
    submit,
    submitDetails,
    reset,
  }
})
