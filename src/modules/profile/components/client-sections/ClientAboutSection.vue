<script setup lang="ts">
import { CalendarDays, CheckCircle2, TrendingUp } from '@lucide/vue'
import { computed } from 'vue'
import ClientProfileSectionShell from '@/modules/profile/components/client-sections/ClientProfileSectionShell.vue'

const props = defineProps<{
  locale: any
  platformLabel: string
  avgOrderLabel?: string | null
  completedLabel?: string | null
}>()

const tiles = computed(() => {
  const items: Array<{
    key: string
    value: string
    hint: string
    icon: typeof CalendarDays
    tone?: string
  }> = [
    {
      key: 'platform',
      value: props.platformLabel,
      hint: props.locale.t.profile.clientAboutPlatform,
      icon: CalendarDays,
    },
  ]

  if (props.completedLabel) {
    items.push({
      key: 'completed',
      value: props.completedLabel,
      hint: props.locale.t.profile.clientStatCompleted,
      icon: CheckCircle2,
      tone: '!border-emerald-500/20 !bg-emerald-500/8 !text-emerald-600',
    })
  }

  if (props.avgOrderLabel) {
    items.push({
      key: 'avg',
      value: props.avgOrderLabel,
      hint: props.locale.t.profile.clientAboutAvgOrder,
      icon: TrendingUp,
      tone: '!border-emerald-500/20 !bg-emerald-500/8 !text-emerald-600',
    })
  }

  return items
})
</script>

<template>
  <ClientProfileSectionShell
    v-if="tiles.length"
    :title="locale.t.profile.clientAboutTitle"
  >
    <div
      class="grid gap-2.5"
      :class="tiles.length === 1 ? 'grid-cols-1' : 'grid-cols-2'"
    >
      <div
        v-for="tile in tiles"
        :key="tile.key"
        class="client-profile-tile flex items-start gap-2.5"
      >
        <span
          class="client-profile-stat__icon !mx-0 shrink-0 !size-8"
          :class="tile.tone"
        >
          <component
            :is="tile.icon"
            class="size-3.5"
          />
        </span>
        <div class="min-w-0 pt-0.5">
          <p class="text-[11px] font-bold leading-tight text-foreground">
            {{ tile.value }}
          </p>
          <p class="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
            {{ tile.hint }}
          </p>
        </div>
      </div>
    </div>
  </ClientProfileSectionShell>
</template>
