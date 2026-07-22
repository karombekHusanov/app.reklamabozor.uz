<script setup lang="ts">
import { MessageCircle, Send, Store } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { ROUTES } from '@/modules/shell/constants/routes'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { resolveAgentChat } from '@/modules/chat/lib/open-agent-chat'
import AgentShowcase from '@/modules/profile/components/AgentShowcase.vue'
import { fetchPublicAgent, type PublicAgent } from '@/modules/marketplace/services/agents.service'

const props = defineProps<{ id: string }>()

const router = useRouter()
const auth = useAuthStore()
const locale = useLocaleStore()
const { haptic } = useTelegram()

const agent = ref<PublicAgent | null>(null)
const loading = ref(true)
const openingChat = ref(false)

const subtitle = computed(() => {
  if (!agent.value) return ''
  if (agent.value.bio) return agent.value.bio
  const labels = agent.value.categories.map(c => categoryName(c, locale.locale))
  if (labels.length) return `${labels.slice(0, 2).join(' & ')} agentligi`
  return locale.t.profile.agentFallbackBody
})

onMounted(async () => {
  try {
    agent.value = await fetchPublicAgent(Number(props.id))
  }
  catch {
    agent.value = null
  }
  finally {
    loading.value = false
  }
})

async function openChat() {
  haptic('light')

  if (!auth.isAuthenticated) {
    await router.push(ROUTES.profile)
    return
  }

  openingChat.value = true
  try {
    const result = await resolveAgentChat(Number(props.id))

    if (result.kind === 'direct') {
      await router.push(ROUTES.chatDirect(result.chatId))
      return
    }

    if (result.kind === 'order') {
      await router.push(ROUTES.chatOrder(result.orderId))
      return
    }

    if (result.kind === 'picker') {
      await router.push({ path: ROUTES.chatThreads, query: { agent: props.id } })
    }
  }
  catch {
    await router.push({ path: ROUTES.chatThreads, query: { agent: props.id } })
  }
  finally {
    openingChat.value = false
  }
}

function orderFromAgency() {
  haptic('light')
  router.push({ path: ROUTES.newOrder, query: { agent: props.id } })
}
</script>

<template>
  <div>
    <div v-if="loading">
      <AppHeader
        :title="locale.t.marketplace.title"
        show-back
      />
      <section class="space-y-4 px-4">
        <Skeleton class="h-32 w-full rounded-3xl" />
        <Skeleton class="h-24 w-full rounded-3xl" />
        <Skeleton class="h-48 w-full rounded-3xl" />
      </section>
    </div>

    <AgentShowcase
      v-else-if="agent"
      :header-title="agent.display_name"
      :name="agent.display_name"
      :logo="agent.company_logo ?? agent.avatar"
      :subtitle="subtitle"
      :is-approved="true"
      :bio="agent.bio"
      :location-label="agent.location_label"
      :website-url="agent.website_url"
      :linkedin-url="agent.linkedin_url"
      :results-text="agent.results_text"
      :completion="agent.completion_percent"
      :completed-orders-count="agent.completed_orders_count"
      :rating-avg="agent.rating_avg"
      :rating-count="agent.rating_count"
      :categories="agent.categories"
      :reviews="agent.reviews ?? []"
      :advantages="agent.advantages ?? []"
      :portfolio="agent.portfolio ?? []"
      :workflow-steps="agent.workflow_steps ?? []"
      :person-type="agent.person_type"
      :person-type-verified="agent.person_type_verified"
      :locale="locale"
    >
      <template #actions>
        <button
          type="button"
          class="agent-profile-order-btn pressable flex-1"
          @click="orderFromAgency"
        >
          <Send class="size-3.5 shrink-0" />
          <span class="min-w-0 text-left">
            <span class="agent-profile-order-btn__title">
              {{ locale.t.marketplace.orderFromAgency }}
            </span>
            <span class="agent-profile-order-btn__hint">
              {{ locale.t.profile.agentOrderHint }}
            </span>
          </span>
        </button>

        <button
          type="button"
          class="agent-profile-chat-btn pressable"
          :disabled="openingChat"
          @click="openChat"
        >
          <MessageCircle class="agent-profile-chat-btn__icon" />
          <span class="agent-profile-chat-btn__label">
            {{ locale.t.profile.agentChatCta }}
          </span>
        </button>
      </template>
    </AgentShowcase>

    <div v-else>
      <AppHeader
        :title="locale.t.marketplace.title"
        show-back
      />
      <section class="px-4">
        <GlassCard
          padding="none"
          class="overflow-hidden"
        >
          <EmptyState
            :icon="Store"
            :title="locale.t.marketplace.emptyTitle"
            :description="locale.t.marketplace.emptyApproved"
          />
        </GlassCard>
      </section>
    </div>
  </div>
</template>
