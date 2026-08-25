<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue'
import Badge from '@/core/ui/Badge.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'

// Renders the MyID "identity verified" trust badge — only when verified.
defineProps<{
  verified?: boolean
}>()

const locale = useLocaleStore()
</script>

<template>
  <Badge
    v-if="verified"
    variant="success"
    class="gap-1"
  >
    <ShieldCheck
      class="size-3"
      aria-hidden="true"
    />
    {{ locale.t.identityVerify.badge }}
  </Badge>
</template>
