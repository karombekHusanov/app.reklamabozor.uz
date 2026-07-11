<script setup lang="ts">
import { Shield, TrendingUp, Trophy, Users } from '@lucide/vue'
import { computed } from 'vue'
import ClientProfileSectionShell from '@/modules/profile/components/client-sections/ClientProfileSectionShell.vue'

const props = defineProps<{
  locale: any
  recommendPercent: number
  showOnTime: boolean
}>()

const insights = computed(() => [
  {
    key: 'on-time',
    title: props.locale.t.profile.clientInsightOnTime,
    icon: Trophy,
    hidden: !props.showOnTime,
  },
  {
    key: 'payments',
    title: props.locale.t.profile.clientInsightPayments,
    icon: Shield,
    hidden: false,
  },
  {
    key: 'recommend',
    title: props.locale.t.profile.clientInsightRecommend.replace('{percent}', String(props.recommendPercent)),
    icon: Users,
    hidden: false,
  },
  {
    key: 'activity',
    title: props.locale.t.profile.clientInsightActivity,
    icon: TrendingUp,
    hidden: false,
  },
].filter(item => !item.hidden))
</script>

<template>
  <ClientProfileSectionShell :title="locale.t.profile.clientInsightsTitle">
    <div class="space-y-2">
      <div
        v-for="item in insights"
        :key="item.key"
        class="client-profile-insight"
      >
        <span class="client-profile-insight__icon">
          <component :is="item.icon" class="size-4" />
        </span>
        <p class="client-profile-insight__text">
          {{ item.title }}
        </p>
      </div>
    </div>
  </ClientProfileSectionShell>
</template>
