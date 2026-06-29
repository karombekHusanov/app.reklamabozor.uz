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
import { useLocaleStore } from '@/core/i18n/locale.store'
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
const locale = useLocaleStore()
const { haptic } = useTelegram()

const editing = ref(false)

// Deep-link target: /agent?order=123 focuses that order in the opportunities list.
const focusOrderId = computed(() => {
  const raw = Array.isArray(route.query.order) ? route.query.order[0] : route.query.order
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

const headerTitle = computed(() => {
  if (agent.isApproved) return locale.t.agent.hubTitle
  if (agent.hasProfile) return locale.t.agent.applicationTitle
  return locale.t.agent.becomeTitle
})

const headerSubtitle = computed(() => {
  if (agent.isApproved) return locale.t.agent.hubSubtitle
  if (agent.isPending) return locale.t.agent.pendingSubtitle
  if (agent.isRejected) return locale.t.agent.rejectedSubtitle
  return locale.t.agent.growSubtitle
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
          {{ locale.t.agent.b2bBadge }}
        </Badge>
        <h2 class="text-xl font-semibold">
          {{ locale.t.agent.guestTitle }}
        </h2>
        <p class="text-sm leading-relaxed text-muted-foreground">
          {{ locale.t.agent.guestBody }}
        </p>
        <Button class="h-12 w-full rounded-2xl text-base" @click="router.push(ROUTES.profile)">
          {{ locale.t.agent.signInToApply }}
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
            {{ locale.t.agent.b2bBadge }}
          </Badge>
          <h2 class="text-xl font-semibold">
            {{ locale.t.agent.introTitle }}
          </h2>
          <p class="text-sm leading-relaxed text-muted-foreground">
            {{ locale.t.agent.introBody }}
          </p>
          <div class="flex items-start gap-3 rounded-2xl bg-muted p-4 dark:bg-white/5">
            <ShieldCheck class="mt-0.5 size-5 text-primary" />
            <div>
              <p class="font-medium">
                {{ locale.t.agent.verifiedBadgeTitle }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{ locale.t.agent.verifiedBadgeBody }}
              </p>
            </div>
          </div>
        </GlassCard>

        <!-- Status (has profile) -->
        <AgentStatusCard v-if="agent.profile" :profile="agent.profile" />

        <!-- Approved → presentation editor -->
        <template v-if="agent.isApproved && agent.profile">
          <div class="flex items-center justify-between px-1">
            <h3 class="text-base font-semibold text-white">
              {{ locale.t.agent.publicProfile }}
            </h3>
            <span class="text-xs text-white/70">{{ locale.t.agent.shownToClients }}</span>
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
          {{ agent.isRejected ? locale.t.agent.updateResubmit : locale.t.agent.editApplication }}
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
