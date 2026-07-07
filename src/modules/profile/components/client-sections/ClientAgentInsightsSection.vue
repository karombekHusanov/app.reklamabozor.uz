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
    cardClass: 'client-insight-card--on-time',
    iconClass: 'client-insight-card__icon--on-time',
  },
  {
    key: 'payments',
    title: props.locale.t.profile.clientInsightPayments,
    icon: Shield,
    hidden: false,
    cardClass: 'client-insight-card--payments',
    iconClass: 'client-insight-card__icon--payments',
  },
  {
    key: 'recommend',
    title: props.locale.t.profile.clientInsightRecommend.replace('{percent}', String(props.recommendPercent)),
    icon: Users,
    hidden: false,
    cardClass: 'client-insight-card--recommend',
    iconClass: 'client-insight-card__icon--recommend',
  },
  {
    key: 'activity',
    title: props.locale.t.profile.clientInsightActivity,
    icon: TrendingUp,
    hidden: false,
    cardClass: 'client-insight-card--activity',
    iconClass: 'client-insight-card__icon--activity',
  },
].filter(item => !item.hidden))
</script>

<template>
  <ClientProfileSectionShell :title="locale.t.profile.clientInsightsTitle">
    <div class="space-y-3">
      <div
        v-for="item in insights"
        :key="item.key"
        class="client-insight-card"
        :class="item.cardClass"
      >
        <span class="client-insight-card__icon" :class="item.iconClass">
          <component :is="item.icon" class="relative z-[1] size-4" />
        </span>
        <p class="client-insight-card__text">
          {{ item.title }}
        </p>
      </div>
    </div>
  </ClientProfileSectionShell>
</template>
