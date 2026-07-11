<script setup lang="ts">
import { MessageCircle, Send } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import type { User } from '@/modules/auth/types/user'
import type { AgentProfile } from '@/modules/agent/types/agent'
import { categoryName } from '@/core/i18n/category-name'
import { ROUTES } from '@/modules/shell/constants/routes'
import AgentShowcase from '@/modules/profile/components/AgentShowcase.vue'
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

const completedOrdersCount = computed(() => publicAgent.value?.completed_orders_count ?? 0)
const ratingAvg = computed(() => publicAgent.value?.rating_avg ?? null)
const ratingCount = computed(() => publicAgent.value?.rating_count ?? 0)
const reviews = computed(() => publicAgent.value?.reviews ?? [])
</script>

<template>
  <AgentShowcase
    :header-title="locale.t.profile.agentPageTitle"
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
    :locale="locale"
  >
    <template #actions>
      <button
        type="button"
        class="agent-profile-order-btn pressable flex-1"
        @click="emit('navigate', ROUTES.orders)"
      >
        <Send class="size-3.5 shrink-0" />
        <span class="min-w-0 text-left">
          <span class="agent-profile-order-btn__title">
            {{ locale.t.profile.agentOrderCta }}
          </span>
          <span class="agent-profile-order-btn__hint">
            {{ locale.t.profile.agentOrderHint }}
          </span>
        </span>
      </button>

      <button
        type="button"
        class="agent-profile-chat-btn pressable"
        @click="emit('navigate', ROUTES.chatThreads)"
      >
        <MessageCircle class="agent-profile-chat-btn__icon" />
        <span class="agent-profile-chat-btn__label">
          {{ locale.t.profile.agentChatCta }}
        </span>
      </button>
    </template>
  </AgentShowcase>
</template>
