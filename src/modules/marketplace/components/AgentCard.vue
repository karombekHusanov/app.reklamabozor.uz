<script setup lang="ts">
import { BadgeCheck, MapPin } from '@lucide/vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Avatar from '@/core/ui/Avatar.vue'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'

defineProps<{
  agent: PublicAgent
}>()
</script>

<template>
  <GlassCard class="space-y-3">
    <div class="flex items-start gap-3">
      <Avatar :src="agent.company_logo" :name="agent.company_name" size="lg" />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <h3 class="truncate font-semibold leading-tight">
            {{ agent.company_name }}
          </h3>
          <BadgeCheck class="size-4 shrink-0 text-primary" />
        </div>
        <p v-if="agent.location_label" class="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin class="size-3 shrink-0" />
          <span class="truncate">{{ agent.location_label }}</span>
        </p>
        <a
          v-if="agent.website_url"
          :href="agent.website_url"
          target="_blank"
          rel="noopener"
          class="mt-0.5 block truncate text-xs text-primary"
        >
          {{ agent.website_url }}
        </a>
      </div>
    </div>

    <p v-if="agent.bio" class="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
      {{ agent.bio }}
    </p>

    <div v-if="agent.categories.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="category in agent.categories"
        :key="category.id"
        class="rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary ring-1 ring-inset ring-primary/15"
      >
        {{ category.name_uz }}
      </span>
    </div>
  </GlassCard>
</template>
