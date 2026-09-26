<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentApplicationForm from '@/modules/agent/components/AgentApplicationForm.vue'
import AgentContractCard from '@/modules/agent/components/AgentContractCard.vue'
import AgentDetailsForm from '@/modules/agent/components/AgentDetailsForm.vue'
import AgentOfferCard from '@/modules/agent/components/AgentOfferCard.vue'
import AgentProfileCompletionBar from '@/modules/profile/components/edit/AgentProfileCompletionBar.vue'
import AgentStatusCard from '@/modules/agent/components/AgentStatusCard.vue'
import AgentVerificationReadOnly from '@/modules/profile/components/edit/AgentVerificationReadOnly.vue'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import type { AgentApplicationPayload, AgentDetailsPayload } from '@/modules/agent/types/agent'
import { ROUTES } from '@/modules/shell/constants/routes'

const agent = useAgentStore()
const locale = useLocaleStore()
const toast = useToast()
const router = useRouter()

const profile = computed(() => agent.profile)
const agentCategories = computed(() => agent.categories.filter(category => category.type === 'agent'))
const canSubmitApplication = computed(() => !agent.hasProfile)
const hasSubmittedApplication = computed(() => agent.hasProfile && !agent.isApproved)
const showDetails = computed(() => agent.isApproved && profile.value)

onMounted(() => {
  void Promise.all([agent.loadProfile(true), agent.loadCategories()])
})

async function handleSubmit(payload: AgentApplicationPayload) {
  const ok = await agent.submit(payload)
  if (ok) {
    toast.success(locale.t.agent.submittedToast)
    void router.push(ROUTES.profile)
  }
}

async function handleSaveDetails(payload: AgentDetailsPayload) {
  const ok = await agent.submitDetails(payload)
  if (ok) {
    toast.success(locale.t.agent.savedToast)
    void router.push(ROUTES.profile)
  }
}

async function handleUploadContract(fileId: number) {
  const ok = await agent.submitSignedContract(fileId)
  if (ok) {
    toast.success(locale.t.agent.contract.uploadedToast)
  }
  else if (agent.error) {
    toast.error(agent.error)
  }
}
</script>

<template>
  <div class="space-y-4">
    <template v-if="agent.isLoadingProfile">
      <Skeleton class="h-40" />
      <Skeleton class="h-72" />
    </template>

    <template v-else>
      <template v-if="canSubmitApplication">
        <GlassCard class="space-y-2">
          <p class="text-sm font-semibold text-foreground">
            {{ locale.t.agent.introTitle }}
          </p>
          <p class="text-xs leading-relaxed text-muted-foreground">
            {{ locale.t.agent.introBody }}
          </p>
        </GlassCard>

        <AgentApplicationForm
          :submitting="agent.isSubmitting"
          @submit="handleSubmit"
        />

        <!-- Not ready for KYC now — back home; a home reminder brings them back. -->
        <Button
          type="button"
          variant="ghost"
          class="h-12 w-full rounded-2xl text-muted-foreground"
          @click="router.replace(ROUTES.home)"
        >
          {{ locale.t.agent.skipApplication }}
        </Button>
      </template>

      <template v-else-if="hasSubmittedApplication && profile">
        <AgentStatusCard :profile="profile" />
        <AgentOfferCard v-if="profile.offer?.needs_acceptance" />
        <AgentContractCard
          v-if="profile.contract"
          :contract="profile.contract"
          :uploading="agent.isUploadingContract"
          @upload="handleUploadContract"
        />
        <AgentVerificationReadOnly :profile="profile" />
        <Button
          type="button"
          variant="outline"
          class="h-12 w-full rounded-2xl"
          @click="router.push(ROUTES.profile)"
        >
          {{ locale.t.profile.backToProfile }}
        </Button>
      </template>

      <template v-else-if="showDetails && profile">
        <AgentOfferCard v-if="profile.offer?.needs_acceptance" />
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
