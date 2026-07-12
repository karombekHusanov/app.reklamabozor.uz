<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'
import type { WorkflowStep } from '@/modules/agent/types/agent'

defineProps<{
  steps: WorkflowStep[]
}>()

const locale = useLocaleStore()

// Step badges cycle through the brand accents, matching the old fixed design.
const STEP_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-rose-500', 'bg-teal-500']
</script>

<template>
  <AgentProfileSectionShell :title="locale.t.profile.agentWorkflowTitle">
    <div class="flex items-start gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <template
        v-for="(step, index) in steps"
        :key="index"
      >
        <div class="flex min-w-[4.75rem] shrink-0 flex-col items-center text-center">
          <span
            class="flex size-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
            :class="STEP_COLORS[index % STEP_COLORS.length]"
          >
            {{ index + 1 }}
          </span>
          <p class="mt-1.5 text-[10px] font-semibold leading-tight text-foreground">
            {{ step.title }}
          </p>
          <p
            v-if="step.description"
            class="agent-profile-info-card__text mt-0.5 text-center"
          >
            {{ step.description }}
          </p>
        </div>

        <ChevronRight
          v-if="index < steps.length - 1"
          class="mt-2 size-3.5 shrink-0 text-muted-foreground/70"
          aria-hidden="true"
        />
      </template>
    </div>
  </AgentProfileSectionShell>
</template>
