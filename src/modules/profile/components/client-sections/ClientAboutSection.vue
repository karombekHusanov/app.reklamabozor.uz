<script setup lang="ts">
import { Activity, CalendarDays, Star, TrendingUp, Zap } from '@lucide/vue'
import ClientProfileSectionShell from '@/modules/profile/components/client-sections/ClientProfileSectionShell.vue'

defineProps<{
  locale: any
  platformLabel: string
  avgOrderLabel: string
  reviewCountLabel: string
  responseTimeLabel: string
  activityLabel: string
}>()
</script>

<template>
  <ClientProfileSectionShell :title="locale.t.profile.clientAboutTitle">
    <div class="grid grid-cols-2 gap-2.5">
      <div class="client-profile-tile flex items-start gap-2.5">
        <span class="client-profile-stat__icon !mx-0 shrink-0 !size-8">
          <CalendarDays class="size-3.5" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="text-[11px] font-bold leading-tight text-foreground">
            {{ platformLabel }}
          </p>
          <p class="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
            {{ locale.t.profile.clientAboutPlatform }}
          </p>
        </div>
      </div>

      <div class="client-profile-tile flex items-start gap-2.5">
        <span class="client-profile-stat__icon !mx-0 shrink-0 !size-8 !border-emerald-500/20 !bg-emerald-500/8 !text-emerald-600">
          <TrendingUp class="size-3.5" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="text-[11px] font-bold leading-tight text-foreground">
            {{ avgOrderLabel }}
          </p>
          <p class="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
            {{ locale.t.profile.clientAboutAvgOrder }}
          </p>
        </div>
      </div>

      <div class="client-profile-tile flex items-start gap-2.5">
        <span class="client-profile-stat__icon !mx-0 shrink-0 !size-8 !border-amber-500/20 !bg-amber-500/8 !text-amber-600">
          <Star class="size-3.5" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="text-[11px] font-bold leading-tight text-foreground">
            {{ reviewCountLabel }}
          </p>
          <p class="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
            {{ locale.t.profile.clientAboutReviews }}
          </p>
        </div>
      </div>

      <div class="client-profile-tile flex items-start gap-2.5">
        <span class="client-profile-stat__icon !mx-0 shrink-0 !size-8 !border-violet-500/20 !bg-violet-500/8 !text-violet-600">
          <Zap class="size-3.5" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="text-[11px] font-bold leading-tight text-foreground">
            {{ responseTimeLabel }}
          </p>
          <p class="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
            {{ locale.t.profile.clientAboutResponse }}
          </p>
        </div>
      </div>

      <div class="client-profile-tile col-span-2 flex items-start gap-2.5">
        <span class="client-profile-stat__icon !mx-0 shrink-0 !size-8 !border-emerald-500/20 !bg-emerald-500/8 !text-emerald-600">
          <Activity class="size-3.5" />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="text-[11px] font-bold leading-tight text-foreground">
            {{ activityLabel }}
          </p>
          <p class="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
            {{ locale.t.profile.clientAboutActivity }}
          </p>
        </div>
      </div>
    </div>
  </ClientProfileSectionShell>
</template>
