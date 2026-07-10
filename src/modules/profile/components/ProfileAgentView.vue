<script setup lang="ts">
import { MessageCircle, Send } from '@lucide/vue'
import { computed } from 'vue'
import type { User } from '@/modules/auth/types/user'
import type { AgentProfile } from '@/modules/agent/types/agent'
import { categoryName } from '@/core/i18n/category-name'
import { ROUTES } from '@/modules/shell/constants/routes'
import AgentShowcase from '@/modules/profile/components/AgentShowcase.vue'
import type { useLocaleStore } from '@/core/i18n/locale.store'

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

const title = computed(() => props.profile?.company_name || props.displayName)
const subtitle = computed(() => {
  if (props.profile?.bio) return props.profile.bio
  const labels = props.profile?.categories.map(c => categoryName(c, props.locale.locale)) ?? []
  if (labels.length) return `${labels.slice(0, 2).join(' & ')} agentligi`
  return props.locale.t.profile.agentFallbackBody
})
const completion = computed(() => props.profile?.completion_percent ?? 0)
const isApproved = computed(() => props.profile?.status === 'approved')
</script>

<template>
  <AgentShowcase
    :header-title="locale.t.profile.agentPageTitle"
    :name="title"
    :logo="profile?.company_logo ?? user.avatar"
    :subtitle="subtitle"
    :is-approved="isApproved"
    :completion="completion"
    :locale="locale"
  >
    <template #actions>
      <button
        type="button"
        class="agent-profile-order-btn pressable flex flex-1 flex-col items-start justify-center gap-0.5 rounded-[14px] px-2.5 py-1.5 text-left"
        @click="emit('navigate', ROUTES.orders)"
      >
        <span class="inline-flex items-center gap-1.5 text-[13px] font-bold leading-none text-white">
          <Send class="size-3.5 shrink-0" />
          {{ locale.t.profile.agentOrderCta }}
        </span>
        <span class="text-[9px] font-medium leading-snug text-white/88">
          {{ locale.t.profile.agentOrderHint }}
        </span>
      </button>

      <button
        type="button"
        class="agent-profile-chat-btn pressable flex shrink-0 items-center gap-2 px-2.5 py-1.5"
        @click="emit('navigate', ROUTES.chat)"
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
</template>
