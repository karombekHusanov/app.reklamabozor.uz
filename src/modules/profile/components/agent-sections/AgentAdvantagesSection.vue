<script setup lang="ts">
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'
import { advantageIcon } from '@/modules/profile/lib/advantage-icons'
import type { Advantage } from '@/modules/agent/types/agent'

defineProps<{
  advantages: Advantage[]
}>()

const locale = useLocaleStore()

function name(advantage: Advantage): string {
  return locale.locale === 'ru' ? advantage.name_ru : advantage.name_uz
}

function hint(advantage: Advantage): string | null {
  return locale.locale === 'ru' ? advantage.hint_ru : advantage.hint_uz
}
</script>

<template>
  <AgentProfileSectionShell :title="locale.t.profile.agentAdvantagesTitle">
    <div class="grid grid-cols-2 gap-2.5">
      <div
        v-for="advantage in advantages"
        :key="advantage.id"
        class="agent-profile-info-card"
      >
        <span class="agent-profile-info-card__icon">
          <component
            :is="advantageIcon(advantage.icon)"
            class="size-4"
          />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="agent-profile-info-card__title">
            {{ name(advantage) }}
          </p>
          <p
            v-if="hint(advantage)"
            class="agent-profile-info-card__text"
          >
            {{ hint(advantage) }}
          </p>
        </div>
      </div>
    </div>
  </AgentProfileSectionShell>
</template>
