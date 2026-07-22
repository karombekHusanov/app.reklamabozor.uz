<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { User } from '@/modules/auth/types/user'
import type { AgentProfile } from '@/modules/agent/types/agent'
import { categoryName } from '@/core/i18n/category-name'
import AgentProfileShortcuts, { type AgentVerificationState } from '@/modules/profile/components/agent-sections/AgentProfileShortcuts.vue'
import AgentShowcase from '@/modules/profile/components/AgentShowcase.vue'
import ProfileSwitcher from '@/modules/profile/components/ProfileSwitcher.vue'
import type { useLocaleStore } from '@/core/i18n/locale.store'
import { fetchPublicAgent, type PublicAgent } from '@/modules/marketplace/services/agents.service'

const props = defineProps<{
  user: User
  profile: AgentProfile | null
  displayName: string
  memberSince: string
  locale: ReturnType<typeof useLocaleStore>
}>()

const emit = defineEmits<{
  navigate: [to: string]
  logout: []
}>()

const publicAgent = ref<PublicAgent | null>(null)

watch(
  () => props.profile?.id,
  async (id) => {
    if (!id || props.profile?.status !== 'approved') {
      publicAgent.value = null
      return
    }

    try {
      publicAgent.value = await fetchPublicAgent(id)
    }
    catch {
      publicAgent.value = null
    }
  },
  { immediate: true },
)

const title = computed(() => props.profile?.company_name || props.displayName)
const subtitle = computed(() => {
  if (props.profile?.bio) return props.profile.bio
  const labels = props.profile?.categories.map(c => categoryName(c, props.locale.locale)) ?? []
  if (labels.length) return `${labels.slice(0, 2).join(' & ')} agentligi`
  return props.locale.t.profile.agentFallbackBody
})
const completion = computed(() => props.profile?.completion_percent ?? 0)
const isApproved = computed(() => props.profile?.status === 'approved')

const verificationState = computed((): AgentVerificationState | undefined => {
  if (!props.profile) return 'none'
  if (props.profile.status === 'pending') return 'pending'
  if (props.profile.status === 'rejected') return 'rejected'
  return undefined
})

const completedOrdersCount = computed(() => publicAgent.value?.completed_orders_count ?? 0)
const ratingAvg = computed(() => publicAgent.value?.rating_avg ?? null)
const ratingCount = computed(() => publicAgent.value?.rating_count ?? 0)
const reviews = computed(() => publicAgent.value?.reviews ?? [])

const pageTitle = computed(() =>
  props.user.role === 'designer'
    ? props.locale.t.profile.designerPageTitle
    : props.locale.t.profile.agentPageTitle,
)
</script>

<template>
  <AgentShowcase
    :header-title="pageTitle"
    :name="title"
    :logo="profile?.company_logo ?? user.avatar"
    :subtitle="subtitle"
    :is-approved="isApproved"
    :bio="profile?.bio ?? null"
    :location-label="profile?.location_label ?? null"
    :website-url="profile?.website_url ?? null"
    :linkedin-url="profile?.linkedin_url ?? null"
    :results-text="profile?.results_text ?? null"
    :completion="completion"
    :completed-orders-count="completedOrdersCount"
    :rating-avg="ratingAvg"
    :rating-count="ratingCount"
    :categories="profile?.categories ?? []"
    :reviews="reviews"
    :advantages="publicAgent?.advantages ?? profile?.advantages ?? []"
    :portfolio="publicAgent?.portfolio ?? profile?.portfolio ?? []"
    :workflow-steps="publicAgent?.workflow_steps ?? profile?.workflow_steps ?? []"
    :person-type="user.person_type"
    :person-type-verified="user.person_type_verified"
    :locale="locale"
  >
    <template #top>
      <ProfileSwitcher />
    </template>

    <template #shortcuts>
      <AgentProfileShortcuts
        :locale="locale"
        :needs-verification="!isApproved"
        :verification-state="verificationState"
        :rejection-reason="profile?.rejection_reason ?? null"
        @navigate="emit('navigate', $event)"
      />
    </template>
  </AgentShowcase>
</template>
