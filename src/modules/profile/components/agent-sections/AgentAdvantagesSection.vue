<script setup lang="ts">
import { PenTool, ShieldCheck, Timer, Truck } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'

const locale = useLocaleStore()

// TODO(backend): replace with agent advantages from API.
</script>

<template>
  <AgentProfileSectionShell :title="locale.t.profile.agentAdvantagesTitle">
    <div class="grid grid-cols-2 gap-2.5">
      <div class="agent-profile-advantage flex items-start gap-2.5">
        <span class="agent-profile-stat__icon !mx-0 shrink-0 !size-8">
          <Timer class="size-3.5" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="text-[11px] font-bold leading-tight text-foreground">
            {{ locale.t.profile.agentAdvantageFastTitle }}
          </p>
          <p class="mt-0.5 text-[9px] leading-snug text-muted-foreground">
            {{ locale.t.profile.agentAdvantageFastHint }}
          </p>
        </div>
      </div>

      <div class="agent-profile-advantage flex items-start gap-2.5">
        <span class="agent-profile-stat__icon !mx-0 shrink-0 !size-8">
          <ShieldCheck class="size-3.5" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="text-[11px] font-bold leading-tight text-foreground">
            {{ locale.t.profile.agentAdvantageQualityTitle }}
          </p>
          <p class="mt-0.5 text-[9px] leading-snug text-muted-foreground">
            {{ locale.t.profile.agentAdvantageQualityHint }}
          </p>
        </div>
      </div>

      <div class="agent-profile-advantage flex items-start gap-2.5">
        <span class="agent-profile-stat__icon !mx-0 shrink-0 !size-8">
          <PenTool class="size-3.5" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="text-[11px] font-bold leading-tight text-foreground">
            {{ locale.t.profile.agentAdvantageDesignTitle }}
          </p>
          <p class="mt-0.5 text-[9px] leading-snug text-muted-foreground">
            {{ locale.t.profile.agentAdvantageDesignHint }}
          </p>
        </div>
      </div>

      <div class="agent-profile-advantage flex items-start gap-2.5">
        <span class="agent-profile-stat__icon !mx-0 shrink-0 !size-8">
          <Truck class="size-3.5" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="text-[11px] font-bold leading-tight text-foreground">
            {{ locale.t.profile.agentAdvantageDeliveryTitle }}
          </p>
          <p class="mt-0.5 text-[9px] leading-snug text-muted-foreground">
            {{ locale.t.profile.agentAdvantageDeliveryHint }}
          </p>
        </div>
      </div>
    </div>
  </AgentProfileSectionShell>
</template>
