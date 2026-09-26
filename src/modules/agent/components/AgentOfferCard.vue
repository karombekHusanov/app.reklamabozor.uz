<script setup lang="ts">
import { FileText } from '@lucide/vue'
import { ref } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { Button } from '@/core/ui/button'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import AgentOfferDrawer from './AgentOfferDrawer.vue'

/**
 * Shown to an existing agent whose accepted offer version is outdated (or who
 * applied before the offer existed) — approval is blocked until they accept.
 */
const agent = useAgentStore()
const locale = useLocaleStore()
const toast = useToast()

const drawerOpen = ref(false)

async function accept() {
  const ok = await agent.acceptOffer()
  if (ok) {
    drawerOpen.value = false
    toast.success(locale.t.agent.offerAcceptedToast)
  }
  else if (agent.error) {
    toast.error(agent.error)
  }
}
</script>

<template>
  <GlassCard class="space-y-3 border-primary/40">
    <p class="text-sm font-semibold">
      {{ locale.t.agent.offerUpdatedTitle }}
    </p>
    <p class="text-xs leading-relaxed text-muted-foreground">
      {{ locale.t.agent.offerUpdatedBody }}
    </p>
    <Button
      type="button"
      class="h-11 w-full rounded-2xl"
      @click="drawerOpen = true"
    >
      <FileText class="size-4" />
      {{ locale.t.agent.offerRead }}
    </Button>

    <AgentOfferDrawer
      v-model:open="drawerOpen"
      :submitting="agent.isAcceptingOffer"
      @accept="accept"
    />
  </GlassCard>
</template>
