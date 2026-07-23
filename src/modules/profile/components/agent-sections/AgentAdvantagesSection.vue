<script setup lang="ts">
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'
import { advantageIcon } from '@/modules/profile/lib/advantage-icons'
import type { Advantage } from '@/modules/agent/types/agent'

defineProps<{
  advantages: Advantage[]
}>()

const locale = useLocaleStore()

/** Accent classes cycled per card so the grid reads as a set, not a wall. */
const ACCENTS = [
  'agent-advantage--primary',
  'agent-advantage--teal',
  'agent-advantage--amber',
  'agent-advantage--violet',
]

function accent(index: number): string {
  return ACCENTS[index % ACCENTS.length]
}

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
        v-for="(advantage, index) in advantages"
        :key="advantage.id"
        class="agent-advantage"
        :class="accent(index)"
      >
        <span class="agent-advantage__icon">
          <component
            :is="advantageIcon(advantage.icon)"
            class="size-[1.15rem]"
          />
        </span>
        <p class="agent-advantage__title">
          {{ name(advantage) }}
        </p>
        <p
          v-if="hint(advantage)"
          class="agent-advantage__text"
        >
          {{ hint(advantage) }}
        </p>
      </div>
    </div>
  </AgentProfileSectionShell>
</template>
