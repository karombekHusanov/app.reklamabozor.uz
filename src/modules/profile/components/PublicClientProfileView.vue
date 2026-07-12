<script setup lang="ts">
import { CheckCircle2, RefreshCw, ShoppingBag, XCircle } from '@lucide/vue'
import { computed } from 'vue'
import { memberDuration } from '@/core/lib/date'
import type { PublicClient } from '@/modules/profile/services/clients.service'
import ClientAboutSection from '@/modules/profile/components/client-sections/ClientAboutSection.vue'
import ClientAgentInsightsSection from '@/modules/profile/components/client-sections/ClientAgentInsightsSection.vue'
import ClientProfileHeaderSection from '@/modules/profile/components/client-sections/ClientProfileHeaderSection.vue'
import type { ClientProfileStat } from '@/modules/profile/components/client-sections/ClientProfileHeaderSection.vue'
import { fullName } from '@/modules/auth/types/user'

const props = defineProps<{
  client: PublicClient
  locale: any
}>()

const displayName = computed(() => fullName(props.client))

const stats = computed<ClientProfileStat[]>(() => [
  {
    value: props.client.total_orders,
    label: props.locale.t.profile.clientStatTotal,
    icon: ShoppingBag,
  },
  {
    value: props.client.in_progress_orders,
    label: props.locale.t.profile.clientStatInProgress,
    icon: RefreshCw,
  },
  {
    value: props.client.completed_orders,
    label: props.locale.t.profile.clientStatCompleted,
    icon: CheckCircle2,
    tone: 'success',
  },
  {
    value: props.client.cancelled_orders,
    label: props.locale.t.profile.clientStatCancelled,
    icon: XCircle,
    tone: 'danger',
  },
])

const rating = computed(() => props.client.rating_avg?.toFixed(1) ?? '0')

const platformLabel = computed(() => {
  const { years, months } = memberDuration(props.client.created_at)
  if (years > 0) {
    return props.locale.t.profile.clientMemberDuration
      .replace('{years}', String(years))
      .replace('{months}', String(months))
  }
  return props.locale.t.profile.clientMemberDurationMonths.replace('{months}', String(Math.max(months, 1)))
})

const reviewCountLabel = computed(() =>
  `${props.client.rating_count} ${props.locale.t.profile.clientReviewsUnit}`.trim(),
)

const responseTimeLabel = computed(() =>
  props.locale.t.profile.clientResponseTime.replace(
    '{minutes}',
    String(props.client.total_orders > 0 ? 15 : 30),
  ),
)

const recommendPercent = computed(() =>
  Math.min(98, 72 + props.client.completed_orders * 4),
)
</script>

<template>
  <div class="client-profile-page pb-6">
    <section class="space-y-4 px-4">
      <ClientProfileHeaderSection
        :user="{ avatar: client.avatar }"
        :display-name="displayName"
        :locale="locale"
        :stats="stats"
        :rating="rating"
        :review-count="client.rating_count"
        :is-verified="client.is_verified"
      />

      <ClientAboutSection
        :locale="locale"
        :platform-label="platformLabel"
        :avg-order-label="locale.t.profile.clientAvgOrderEmpty"
        :review-count-label="reviewCountLabel"
        :response-time-label="responseTimeLabel"
        :activity-label="locale.t.profile.clientAboutOnlineToday"
      />

      <ClientAgentInsightsSection
        :locale="locale"
        :recommend-percent="recommendPercent"
        :show-on-time="client.completed_orders > 0"
      />
    </section>
  </div>
</template>
