<script setup lang="ts">
import { ExternalLink, MapPin, Share2 } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'

defineProps<{
  locationLabel: string | null
  websiteUrl: string | null
  linkedinUrl: string | null
}>()

const locale = useLocaleStore()
</script>

<template>
  <AgentProfileSectionShell :title="locale.t.profile.agentContactTitle">
    <div class="space-y-2.5">
      <div
        v-if="locationLabel"
        class="agent-profile-advantage flex items-start gap-2.5"
      >
        <span class="agent-profile-stat__icon !mx-0 shrink-0 !size-8">
          <MapPin class="size-3.5" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="text-[11px] font-bold leading-tight text-foreground">
            {{ locale.t.profile.location }}
          </p>
          <p class="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {{ locationLabel }}
          </p>
        </div>
      </div>

      <a
        v-if="websiteUrl"
        :href="websiteUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="agent-profile-advantage pressable flex items-start gap-2.5"
      >
        <span class="agent-profile-stat__icon !mx-0 shrink-0 !size-8">
          <ExternalLink class="size-3.5" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="text-[11px] font-bold leading-tight text-foreground">
            {{ locale.t.profile.website }}
          </p>
          <p class="mt-0.5 truncate text-[11px] leading-snug text-primary">
            {{ websiteUrl }}
          </p>
        </div>
      </a>

      <a
        v-if="linkedinUrl"
        :href="linkedinUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="agent-profile-advantage pressable flex items-start gap-2.5"
      >
        <span class="agent-profile-stat__icon !mx-0 shrink-0 !size-8">
          <Share2 class="size-3.5" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="text-[11px] font-bold leading-tight text-foreground">
            {{ locale.t.agent.linkedin }}
          </p>
          <p class="mt-0.5 truncate text-[11px] leading-snug text-primary">
            {{ linkedinUrl }}
          </p>
        </div>
      </a>
    </div>
  </AgentProfileSectionShell>
</template>
