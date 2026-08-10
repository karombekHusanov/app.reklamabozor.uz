<script setup lang="ts">
import { CheckCircle2, RefreshCw, ShoppingBag, XCircle } from '@lucide/vue'
import { computed } from 'vue'
import { memberDuration } from '@/core/lib/date'
import type { PublicClient } from '@/modules/profile/services/clients.service'
import ClientAboutSection from '@/modules/profile/components/client-sections/ClientAboutSection.vue'
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

const rating = computed(() =>
  props.client.rating_avg != null ? props.client.rating_avg.toFixed(1) : null,
)

const platformLabel = computed(() => {
  const { years, months } = memberDuration(props.client.created_at)
  if (years > 0) {
    return props.locale.t.profile.clientMemberDuration
      .replace('{years}', String(years))
      .replace('{months}', String(months))
  }
  return props.locale.t.profile.clientMemberDurationMonths.replace('{months}', String(Math.max(months, 1)))
})

const completedLabel = computed(() =>
  props.client.completed_orders > 0
    ? String(props.client.completed_orders)
    : null,
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
        :show-back="true"
      />

      <ClientAboutSection
        :locale="locale"
        :platform-label="platformLabel"
        :completed-label="completedLabel"
      />
    </section>
  </div>
</template>
