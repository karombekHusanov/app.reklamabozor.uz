<script setup lang="ts">
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'

defineProps<{
  text: string
}>()

const locale = useLocaleStore()
</script>

<template>
  <AgentProfileSectionShell :title="locale.t.profile.agentResultsTitle">
    <p class="whitespace-pre-line text-[12px] leading-relaxed text-muted-foreground">
      {{ text }}
    </p>
  </AgentProfileSectionShell>
</template>
