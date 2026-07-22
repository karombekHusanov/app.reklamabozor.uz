<script setup lang="ts">
import { BadgeCheck, Building2, Clock, User } from '@lucide/vue'
import { computed } from 'vue'
import Badge from '@/core/ui/Badge.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { LegalEntityStatus, PersonType } from '@/modules/auth/types/user'

const props = defineProps<{
  type: PersonType | null
  verified?: boolean
  /** Own-profile view: reflects the pending verification state too. */
  status?: LegalEntityStatus | null
}>()

const locale = useLocaleStore()

const model = computed(() => {
  if (props.type === 'legal_entity') {
    if (props.verified) {
      return { variant: 'success' as const, icon: BadgeCheck, label: locale.t.personType.legalEntity }
    }
    if (props.status === 'pending') {
      return {
        variant: 'primary' as const,
        icon: Clock,
        label: `${locale.t.personType.legalEntity} · ${locale.t.personType.pending}`,
      }
    }
    return {
      variant: 'warning' as const,
      icon: Building2,
      label: `${locale.t.personType.legalEntity} · ${locale.t.personType.unverified}`,
    }
  }
  if (props.type === 'individual') {
    return { variant: 'default' as const, icon: User, label: locale.t.personType.individual }
  }
  return null
})
</script>

<template>
  <Badge
    v-if="model"
    :variant="model.variant"
    class="gap-1"
  >
    <component
      :is="model.icon"
      class="size-3"
      aria-hidden="true"
    />
    {{ model.label }}
  </Badge>
</template>
