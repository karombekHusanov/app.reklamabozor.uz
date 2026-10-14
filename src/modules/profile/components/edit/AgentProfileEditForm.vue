<script setup lang="ts">
import { Building2, User } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentApplicationForm from '@/modules/agent/components/AgentApplicationForm.vue'
import AgentDetailsForm from '@/modules/agent/components/AgentDetailsForm.vue'
import AgentOfferCard from '@/modules/agent/components/AgentOfferCard.vue'
import IndividualApplicationForm from '@/modules/agent/components/IndividualApplicationForm.vue'
import LegalUpgradeCard from '@/modules/agent/components/LegalUpgradeCard.vue'
import AgentProfileCompletionBar from '@/modules/profile/components/edit/AgentProfileCompletionBar.vue'
import AgentStatusCard from '@/modules/agent/components/AgentStatusCard.vue'
import AgentVerificationReadOnly from '@/modules/profile/components/edit/AgentVerificationReadOnly.vue'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import type {
  AgentApplicationPayload,
  AgentDetailsPayload,
  IndividualApplicationPayload,
} from '@/modules/agent/types/agent'
import { ROUTES } from '@/modules/shell/constants/routes'

// Executor ("ijrochi") profile: one agent role, two legal tracks — individual
// (light KYC, Tezkor) and legal entity (full KYC, Tender). An approved
// individual can later ask to be raised to the legal track (`?upgrade=1`).
type Track = 'individual' | 'legal'

const agent = useAgentStore()
const locale = useLocaleStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const profile = computed(() => agent.profile)
const canSubmitApplication = computed(() => !agent.hasProfile)
const hasSubmittedApplication = computed(() => agent.hasProfile && !agent.isApproved)
const showDetails = computed(() => agent.isApproved && profile.value)

// Track picked for a brand-new application; `?track=` preselects it.
const track = ref<Track | null>(null)
watch(
  () => route.query.track,
  (value) => {
    track.value = value === 'individual' || value === 'legal' ? value : null
  },
  { immediate: true },
)

const upgradeMode = computed(() =>
  route.query.upgrade === '1' && Boolean(profile.value?.upgrade?.can_request),
)

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

async function handleSubmitIndividual(payload: IndividualApplicationPayload) {
  const ok = await agent.submitIndividual(payload)
  if (ok) {
    toast.success(locale.t.agent.submittedToast)
    void router.push(ROUTES.profile)
  }
  else if (agent.error) {
    toast.error(agent.error)
  }
}

async function handleUpgrade(payload: AgentApplicationPayload) {
  const ok = await agent.requestUpgrade(payload)
  if (ok) {
    toast.success(locale.t.executor.upgradeSubmittedToast)
    void router.replace({ query: { ...route.query, upgrade: undefined } })
  }
  else if (agent.error) {
    toast.error(agent.error)
  }
}

function startUpgrade() {
  void router.push({ query: { ...route.query, upgrade: '1' } })
}

async function handleSaveDetails(payload: AgentDetailsPayload) {
  const ok = await agent.submitDetails(payload)
  if (ok) {
    toast.success(locale.t.agent.savedToast)
    void router.push(ROUTES.profile)
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
      <!-- New application: pick the legal track first. -->
      <template v-if="canSubmitApplication">
        <GlassCard class="space-y-3">
          <div class="space-y-1">
            <p class="text-sm font-semibold text-foreground">
              {{ locale.t.executor.trackTitle }}
            </p>
            <p class="text-xs leading-relaxed text-muted-foreground">
              {{ locale.t.executor.trackHint }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="glass-chip flex min-h-11 flex-col items-start gap-1 rounded-2xl px-3 py-3 text-left"
              :class="track === 'individual' ? 'ring-2 ring-primary' : ''"
              :aria-pressed="track === 'individual'"
              @click="track = 'individual'"
            >
              <User class="size-4 text-primary" />
              <span class="text-[13px] font-semibold">{{ locale.t.executor.trackIndividual }}</span>
              <span class="text-[11px] leading-snug text-muted-foreground">{{ locale.t.executor.trackIndividualHint }}</span>
            </button>
            <button
              type="button"
              class="glass-chip flex min-h-11 flex-col items-start gap-1 rounded-2xl px-3 py-3 text-left"
              :class="track === 'legal' ? 'ring-2 ring-primary' : ''"
              :aria-pressed="track === 'legal'"
              @click="track = 'legal'"
            >
              <Building2 class="size-4 text-primary" />
              <span class="text-[13px] font-semibold">{{ locale.t.executor.trackLegal }}</span>
              <span class="text-[11px] leading-snug text-muted-foreground">{{ locale.t.executor.trackLegalHint }}</span>
            </button>
          </div>
        </GlassCard>

        <IndividualApplicationForm
          v-if="track === 'individual'"
          :categories="agent.categories"
          :submitting="agent.isSubmitting"
          @submit="handleSubmitIndividual"
        />

        <AgentApplicationForm
          v-else-if="track === 'legal'"
          :submitting="agent.isSubmitting"
          @submit="handleSubmit"
        />

        <!-- Not ready for KYC now — back home; a home reminder brings them back. -->
        <Button
          v-if="track === null"
          type="button"
          variant="ghost"
          class="h-12 w-full rounded-2xl text-muted-foreground"
          @click="router.replace(ROUTES.home)"
        >
          {{ locale.t.agent.skipApplication }}
        </Button>
      </template>

      <!-- Approved individual → legal-entity request (full KYC, prefilled). -->
      <template v-else-if="upgradeMode && profile">
        <GlassCard class="space-y-2">
          <p class="text-sm font-semibold text-foreground">
            {{ locale.t.executor.upgradeTitle }}
          </p>
          <p class="text-xs leading-relaxed text-muted-foreground">
            {{ locale.t.executor.upgradeFormIntro }}
          </p>
        </GlassCard>

        <AgentApplicationForm
          :initial="profile"
          :submitting="agent.isSubmitting"
          @submit="handleUpgrade"
        />
      </template>

      <template v-else-if="hasSubmittedApplication && profile">
        <AgentStatusCard :profile="profile" />
        <AgentOfferCard v-if="profile.offer?.needs_acceptance" />
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
        <LegalUpgradeCard
          :profile="profile"
          @start="startUpgrade"
        />
        <AgentOfferCard v-if="profile.offer?.needs_acceptance" />
        <AgentProfileCompletionBar :percent="profile.completion_percent" />
        <!-- Either track may list any category (agency and design). -->
        <AgentDetailsForm
          :profile="profile"
          :categories="agent.categories"
          :saving="agent.isSavingDetails"
          @save="handleSaveDetails"
        />
      </template>
    </template>
  </div>
</template>
