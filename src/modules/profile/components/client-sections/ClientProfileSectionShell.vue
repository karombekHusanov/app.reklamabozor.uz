<script setup lang="ts">
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'

defineProps<{
  title: string
  showViewAll?: boolean
}>()

defineEmits<{
  viewAll: []
}>()
</script>

<template>
  <AgentProfileSectionShell
    :title="title"
    :show-view-all="showViewAll"
    @view-all="$emit('viewAll')"
  >
    <slot />
  </AgentProfileSectionShell>
</template>
