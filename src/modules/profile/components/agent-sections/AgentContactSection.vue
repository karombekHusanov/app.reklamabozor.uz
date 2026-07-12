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
        class="agent-profile-info-card"
      >
        <span class="agent-profile-info-card__icon">
          <MapPin class="size-4" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="agent-profile-info-card__title">
            {{ locale.t.profile.location }}
          </p>
          <p class="agent-profile-info-card__text">
            {{ locationLabel }}
          </p>
        </div>
      </div>

      <a
        v-if="websiteUrl"
        :href="websiteUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="agent-profile-info-card pressable"
      >
        <span class="agent-profile-info-card__icon">
          <ExternalLink class="size-4" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="agent-profile-info-card__title">
            {{ locale.t.profile.website }}
          </p>
          <p class="agent-profile-info-card__link">
            {{ websiteUrl }}
          </p>
        </div>
      </a>

      <a
        v-if="linkedinUrl"
        :href="linkedinUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="agent-profile-info-card pressable"
      >
        <span class="agent-profile-info-card__icon">
          <Share2 class="size-4" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="agent-profile-info-card__title">
            {{ locale.t.agent.linkedin }}
          </p>
          <p class="agent-profile-info-card__link">
            {{ linkedinUrl }}
          </p>
        </div>
      </a>
    </div>
  </AgentProfileSectionShell>
</template>
