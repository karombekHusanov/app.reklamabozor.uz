<script setup lang="ts">
import { CircleCheck, CircleX, Clock, MapPin } from '@lucide/vue'
import { computed } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Badge from '@/core/ui/Badge.vue'
import Avatar from '@/core/ui/Avatar.vue'
import CategoryChips from '@/modules/agent/components/CategoryChips.vue'
import type { AgentProfile } from '@/modules/agent/types/agent'

const props = defineProps<{
  profile: AgentProfile
}>()

const meta = computed(() => {
  switch (props.profile.status) {
    case 'approved':
      return {
        icon: CircleCheck,
        label: 'Approved',
        message: 'Live in the marketplace, visible to clients.',
        iconWrap: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      }
    case 'rejected':
      return {
        icon: CircleX,
        label: 'Rejected',
        message: 'Needs changes — see the feedback below.',
        iconWrap: 'bg-red-500/12 text-red-600 dark:text-red-400',
        badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-300',
      }
    default:
      return {
        icon: Clock,
        label: 'Pending',
        message: 'Under review · usually 1–2 business days.',
        iconWrap: 'bg-primary/12 text-primary',
        badgeClass: 'bg-primary/15 text-primary',
      }
  }
})
</script>

<template>
  <GlassCard class="space-y-4">
    <!-- Header: company name is the title, status shown as a badge beside it -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-start gap-3">
        <Avatar
          v-if="profile.status === 'approved' && profile.company_logo"
          :src="profile.company_logo"
          :name="profile.company_name"
          size="md"
        />
        <div
          v-else
          class="flex size-11 shrink-0 items-center justify-center rounded-2xl"
          :class="meta.iconWrap"
        >
          <component :is="meta.icon" class="size-6" />
        </div>
        <div class="min-w-0">
          <h2 class="truncate text-lg font-semibold leading-tight">
            {{ profile.company_name }}
          </h2>
          <p class="mt-0.5 text-sm text-muted-foreground">
            {{ meta.message }}
          </p>
        </div>
      </div>
      <Badge class="shrink-0" :class="meta.badgeClass">
        {{ meta.label }}
      </Badge>
    </div>

    <!-- Profile completion (approved only) -->
    <div v-if="profile.status === 'approved'" class="space-y-1.5">
      <div class="flex items-center justify-between text-xs">
        <span class="font-medium text-muted-foreground">Profile completeness</span>
        <span class="font-semibold text-primary">{{ profile.completion_percent }}%</span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          class="h-full rounded-full bg-primary transition-all duration-500"
          :style="{ width: `${profile.completion_percent}%` }"
        />
      </div>
    </div>

    <!-- Rejection feedback -->
    <div
      v-if="profile.status === 'rejected' && profile.rejection_reason"
      class="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
    >
      <p class="font-medium">
        Reviewer feedback
      </p>
      <p class="mt-1">
        {{ profile.rejection_reason }}
      </p>
    </div>

    <!-- Categories -->
    <div
      v-if="profile.categories.length"
      class="border-t border-black/5 pt-4 dark:border-white/10"
    >
      <p class="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Categories
      </p>
      <CategoryChips :categories="profile.categories" />
    </div>

    <!-- Location -->
    <div
      v-if="profile.location_label"
      class="flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      <MapPin class="size-4 shrink-0" />
      {{ profile.location_label }}
    </div>
  </GlassCard>
</template>
