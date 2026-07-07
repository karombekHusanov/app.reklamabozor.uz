<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'

const locale = useLocaleStore()

const steps = [
  {
    id: 1,
    titleKey: 'agentWorkflowStep1Title',
    hintKey: 'agentWorkflowStep1Hint',
  },
  {
    id: 2,
    titleKey: 'agentWorkflowStep2Title',
    hintKey: 'agentWorkflowStep2Hint',
  },
  {
    id: 3,
    titleKey: 'agentWorkflowStep3Title',
    hintKey: 'agentWorkflowStep3Hint',
  },
  {
    id: 4,
    titleKey: 'agentWorkflowStep4Title',
    hintKey: 'agentWorkflowStep4Hint',
  },
] as const
</script>

<template>
  <AgentProfileSectionShell :title="locale.t.profile.agentWorkflowTitle">
    <div class="flex items-start gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <template
        v-for="(step, index) in steps"
        :key="step.id"
      >
        <div class="flex min-w-[4.75rem] shrink-0 flex-col items-center text-center">
          <span
            class="flex size-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
            :class="{
              'bg-blue-500': step.id === 1,
              'bg-emerald-500': step.id === 2,
              'bg-violet-500': step.id === 3,
              'bg-orange-500': step.id === 4,
            }"
          >
            {{ step.id }}
          </span>
          <p class="mt-1.5 text-[10px] font-bold leading-tight text-foreground">
            {{ locale.t.profile[step.titleKey] }}
          </p>
          <p class="mt-0.5 text-[8px] leading-snug text-muted-foreground">
            {{ locale.t.profile[step.hintKey] }}
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
