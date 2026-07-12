<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentApplicationForm from '@/modules/agent/components/AgentApplicationForm.vue'
import AgentDetailsForm from '@/modules/agent/components/AgentDetailsForm.vue'
import AgentProfileCompletionBar from '@/modules/profile/components/edit/AgentProfileCompletionBar.vue'
import AgentStatusCard from '@/modules/agent/components/AgentStatusCard.vue'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import type { AgentApplicationPayload, AgentDetailsPayload } from '@/modules/agent/types/agent'
import { ROUTES } from '@/modules/shell/constants/routes'

const agent = useAgentStore()
const locale = useLocaleStore()
const toast = useToast()
const router = useRouter()

const profile = computed(() => agent.profile)
const agentCategories = computed(() => agent.categories.filter(category => category.type === 'agent'))
const showApplication = computed(() => !agent.isApproved)
const showDetails = computed(() => agent.isApproved && profile.value)

onMounted(() => {
  void Promise.all([agent.loadProfile(true), agent.loadCategories()])
})

async function handleSubmit(payload: AgentApplicationPayload) {
  const ok = await agent.submit(payload)
  if (ok) {
    toast.success(locale.t.agent.submittedToast)
    return
  }
  if (agent.error) toast.error(agent.error)
}

async function handleSaveDetails(payload: AgentDetailsPayload) {
  const ok = await agent.submitDetails(payload)
  if (ok) {
    toast.success(locale.t.agent.savedToast)
    void router.push(ROUTES.profile)
    return
  }
  if (agent.error) toast.error(agent.error)
}
</script>

<template>
  <div class="space-y-4">
    <template v-if="agent.isLoadingProfile">
      <Skeleton class="h-40" />
      <Skeleton class="h-72" />
    </template>

    <template v-else>
      <GlassCard
        v-if="!profile"
        class="space-y-2"
      >
        <p class="text-sm font-semibold text-foreground">
          {{ locale.t.agent.introTitle }}
        </p>
        <p class="text-xs leading-relaxed text-muted-foreground">
          {{ locale.t.agent.introBody }}
        </p>
      </GlassCard>

      <template v-if="showApplication && profile">
        <AgentStatusCard :profile="profile" />
        <AgentApplicationForm
          :initial="profile"
          :submitting="agent.isSubmitting"
          @submit="handleSubmit"
        />
      </template>

      <template v-else-if="showDetails && profile">
        <AgentProfileCompletionBar :percent="profile.completion_percent" />
        <AgentDetailsForm
          :profile="profile"
          :categories="agentCategories"
          :saving="agent.isSavingDetails"
          @save="handleSaveDetails"
        />
      </template>
    </template>
  </div>
</template>
