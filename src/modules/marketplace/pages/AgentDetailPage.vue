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
import AgentShowcase from '@/modules/profile/components/AgentShowcase.vue'
import { fetchPublicAgent, type PublicAgent } from '@/modules/marketplace/services/agents.service'

const props = defineProps<{ id: string }>()

const router = useRouter()
const locale = useLocaleStore()
const { haptic } = useTelegram()

const agent = ref<PublicAgent | null>(null)
const loading = ref(true)

// Only approved agencies are ever returned publicly, so a loaded agent is approved.
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

function openChat() {
  haptic('light')
  // Contextual chat — pass the agent id so the conversation targets this agency.
  router.push({ path: ROUTES.chat, query: { agent: props.id } })
}

function orderFromAgency() {
  haptic('light')
  // Direct order — the wizard limits categories to this agency and only it is notified.
  router.push({ path: ROUTES.newOrder, query: { agent: props.id } })
}
</script>

<template>
  <!-- Single stable root so AppLayout's <Transition> doesn't get stuck when the
       loading branch swaps to the showcase (a changing root breaks the animation). -->
  <div>
    <!-- Loading -->
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

    <!-- Loaded — same presentation as the owner's profile, minus owner-only CTAs -->
    <AgentShowcase
      v-else-if="agent"
      :header-title="agent.company_name"
      :name="agent.company_name"
      :logo="agent.company_logo"
      :subtitle="subtitle"
      :is-approved="true"
      :completion="agent.completion_percent"
      :locale="locale"
    >
      <template #actions>
        <button
          type="button"
          class="agent-profile-order-btn pressable flex flex-1 flex-col items-start justify-center gap-0.5 rounded-[14px] px-2.5 py-1.5 text-left"
          @click="orderFromAgency"
        >
          <span class="inline-flex items-center gap-1.5 text-[13px] font-bold leading-none text-white">
            <Send class="size-3.5 shrink-0" />
            {{ locale.t.marketplace.orderFromAgency }}
          </span>
          <span class="text-[9px] font-medium leading-snug text-white/88">
            {{ locale.t.profile.agentOrderHint }}
          </span>
        </button>

        <button
          type="button"
          class="agent-profile-chat-btn pressable flex shrink-0 items-center gap-2 px-2.5 py-1.5"
          @click="openChat"
        >
          <span class="agent-profile-stat__icon !size-7 shrink-0">
            <MessageCircle class="size-3.5" />
          </span>
          <span class="max-w-[4.5rem] text-left text-[9px] font-semibold leading-tight text-foreground">
            {{ locale.t.profile.agentChatCta }}
          </span>
        </button>
      </template>
    </AgentShowcase>

    <!-- Not found -->
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
