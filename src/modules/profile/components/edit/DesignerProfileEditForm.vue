<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentApplicationForm from '@/modules/agent/components/AgentApplicationForm.vue'
import AgentStatusCard from '@/modules/agent/components/AgentStatusCard.vue'
import DesignerDetailsForm from '@/modules/profile/components/edit/DesignerDetailsForm.vue'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import type { AgentApplicationPayload, AgentDetailsPayload } from '@/modules/agent/types/agent'
import { ROUTES } from '@/modules/shell/constants/routes'

const agent = useAgentStore()
const locale = useLocaleStore()
const toast = useToast()
const router = useRouter()

const profile = computed(() => agent.profile)
const designerCategories = computed(() => agent.categories.filter(category => category.type === 'designer'))
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
    toast.success(locale.t.profile.savedToast)
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
          {{ locale.t.designer.introTitle }}
        </p>
        <p class="text-xs leading-relaxed text-muted-foreground">
          {{ locale.t.designer.introBody }}
        </p>
      </GlassCard>

      <AgentStatusCard
        v-if="profile"
        :profile="profile"
      />

      <AgentApplicationForm
        v-if="showApplication"
        :initial="profile"
        :submitting="agent.isSubmitting"
        @submit="handleSubmit"
      />

      <DesignerDetailsForm
        v-if="showDetails && profile"
        :profile="profile"
        :categories="designerCategories"
        :saving="agent.isSavingDetails"
        @save="handleSaveDetails"
      />
    </template>
  </div>
</template>
