<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import DesignerCreateForm from '@/modules/profile/components/edit/DesignerCreateForm.vue'
import DesignerDetailsForm from '@/modules/profile/components/edit/DesignerDetailsForm.vue'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import type { AgentDetailsPayload, DesignerProfilePayload } from '@/modules/agent/types/agent'
import { ROUTES } from '@/modules/shell/constants/routes'

const agent = useAgentStore()
const locale = useLocaleStore()
const toast = useToast()
const router = useRouter()

const profile = computed(() => agent.profile)
const designerCategories = computed(() => agent.categories.filter(category => category.type === 'designer'))
// Dizaynerda KYC yo'q: profil bor = darhol approved, forma faqat profil yo'qligida.
const showCreate = computed(() => !profile.value)
const showDetails = computed(() => Boolean(profile.value))

onMounted(() => {
  void Promise.all([agent.loadProfile(true), agent.loadCategories()])
})

async function handleCreate(payload: DesignerProfilePayload) {
  const ok = await agent.submitDesigner(payload)
  if (ok) {
    toast.success(locale.t.designer.createdToast)
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

      <DesignerCreateForm
        v-if="showCreate"
        :categories="designerCategories"
        :submitting="agent.isSubmitting"
        @submit="handleCreate"
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
