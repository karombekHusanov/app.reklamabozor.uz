<script setup lang="ts">
import { PencilLine, ShieldCheck } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Badge from '@/core/ui/Badge.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import AgentApplicationForm from '@/modules/agent/components/AgentApplicationForm.vue'
import AgentDetailsForm from '@/modules/agent/components/AgentDetailsForm.vue'
import AgentOrdersSection from '@/modules/agent/components/AgentOrdersSection.vue'
import AgentStatusCard from '@/modules/agent/components/AgentStatusCard.vue'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import type {
  AgentApplicationPayload,
  AgentDetailsPayload,
} from '@/modules/agent/types/agent'

const auth = useAuthStore()
const agent = useAgentStore()
const router = useRouter()
const route = useRoute()
const { haptic } = useTelegram()

const editing = ref(false)

// Deep-link target: /agent?order=123 focuses that order in the opportunities list.
const focusOrderId = computed(() => {
  const raw = Array.isArray(route.query.order) ? route.query.order[0] : route.query.order
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

const headerTitle = computed(() => {
  if (agent.isApproved) return 'Agent hub'
  if (agent.hasProfile) return 'Your application'
  return 'Become an agent'
})

const headerSubtitle = computed(() => {
  if (agent.isApproved) return 'Your business workspace'
  if (agent.isPending) return 'Pending review'
  if (agent.isRejected) return 'Action needed'
  return 'Grow with AdSpace'
})

// The KYC form is shown for a brand-new application, or when editing/resubmitting.
const showForm = computed(() => agent.canApply || editing.value)

async function loadData() {
  if (!auth.isAuthenticated) return
  await Promise.all([agent.loadProfile(), agent.loadCategories()])
}

onMounted(loadData)
watch(() => auth.isAuthenticated, (authed) => {
  if (authed) loadData()
})

async function handleSubmit(payload: AgentApplicationPayload) {
  haptic('light')
  const ok = await agent.submit(payload)

  if (ok) {
    editing.value = false
    haptic('medium')
  }
}

async function handleSaveDetails(payload: AgentDetailsPayload) {
  haptic('light')
  const ok = await agent.submitDetails(payload)
  if (ok) haptic('medium')
}

function startEditing() {
  haptic('light')
  editing.value = true
}
</script>

<template>
  <div>
    <AppHeader :title="headerTitle" :subtitle="headerSubtitle" />

    <section class="space-y-5 px-5">
      <!-- Guest -->
      <GlassCard v-if="!auth.isAuthenticated" class="space-y-4">
        <Badge variant="primary">
          B2B onboarding
        </Badge>
        <h2 class="text-xl font-semibold">
          Turn your ad inventory into a marketplace profile
        </h2>
        <p class="text-sm leading-relaxed text-muted-foreground">
          Sign in with Telegram to submit your company details, get verified, and start receiving client requests.
        </p>
        <Button class="h-12 w-full rounded-2xl text-base" @click="router.push(ROUTES.profile)">
          Sign in to apply
        </Button>
      </GlassCard>

      <!-- Loading -->
      <template v-else-if="agent.isLoadingProfile && !agent.loaded">
        <Skeleton class="h-40 w-full rounded-3xl" />
        <Skeleton class="h-56 w-full rounded-3xl" />
      </template>

      <template v-else>
        <!-- Intro (no profile yet) -->
        <GlassCard v-if="!agent.hasProfile" class="space-y-3">
          <Badge variant="primary">
            B2B onboarding
          </Badge>
          <h2 class="text-xl font-semibold">
            Become an advertising agent
          </h2>
          <p class="text-sm leading-relaxed text-muted-foreground">
            Submit your company &amp; legal details for verification. Once approved, you can build your public marketplace profile.
          </p>
          <div class="flex items-start gap-3 rounded-2xl bg-black/5 p-4 dark:bg-white/5">
            <ShieldCheck class="mt-0.5 size-5 text-primary" />
            <div>
              <p class="font-medium">
                Verified agent badge
              </p>
              <p class="text-sm text-muted-foreground">
                Build trust with business verification and ratings.
              </p>
            </div>
          </div>
        </GlassCard>

        <!-- Status (has profile) -->
        <AgentStatusCard v-if="agent.profile" :profile="agent.profile" />

        <!-- Approved → presentation editor -->
        <template v-if="agent.isApproved && agent.profile">
          <div class="flex items-center justify-between px-1">
            <h3 class="text-base font-semibold">
              Public profile
            </h3>
            <span class="text-xs text-muted-foreground">Shown to clients</span>
          </div>
          <AgentDetailsForm
            :profile="agent.profile"
            :categories="agent.categories"
            :saving="agent.isSavingDetails"
            @save="handleSaveDetails"
          />

          <AgentOrdersSection :focus-order-id="focusOrderId" />
        </template>

        <!-- Edit / resubmit affordance for pending or rejected -->
        <Button
          v-if="agent.hasProfile && !agent.isApproved && !showForm"
          variant="outline"
          class="h-11 w-full rounded-2xl"
          @click="startEditing"
        >
          <PencilLine class="size-4" />
          {{ agent.isRejected ? 'Update & resubmit' : 'Edit application' }}
        </Button>

        <!-- The KYC application form -->
        <AgentApplicationForm
          v-if="showForm"
          :initial="agent.profile"
          :submitting="agent.isSubmitting"
          @submit="handleSubmit"
        />

        <p
          v-if="agent.error"
          class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {{ agent.error }}
        </p>
      </template>
    </section>
  </div>
</template>
