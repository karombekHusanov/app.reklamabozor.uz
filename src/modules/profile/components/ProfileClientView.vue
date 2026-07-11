<script setup lang="ts">
import { CheckCircle2, RefreshCw, ShoppingBag, XCircle } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { memberDuration } from '@/core/lib/date'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { User } from '@/modules/auth/types/user'
import type { OrderStatus } from '@/modules/orders/types/order'
import { formatPrice } from '@/modules/orders/lib/order-status'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import ClientAboutSection from '@/modules/profile/components/client-sections/ClientAboutSection.vue'
import ClientAgentInsightsSection from '@/modules/profile/components/client-sections/ClientAgentInsightsSection.vue'
import ClientOrderHistorySection from '@/modules/profile/components/client-sections/ClientOrderHistorySection.vue'
import ClientProfileHeaderSection from '@/modules/profile/components/client-sections/ClientProfileHeaderSection.vue'
import ClientProfileShortcuts from '@/modules/profile/components/client-sections/ClientProfileShortcuts.vue'
import type { ClientProfileStat } from '@/modules/profile/components/client-sections/ClientProfileHeaderSection.vue'

const props = defineProps<{
  user: User
  displayName: string
  memberSince: string
  locale: any
}>()

const emit = defineEmits<{
  navigate: [to: string]
}>()

const orders = useOrdersStore()

const IN_PROGRESS_STATUSES: OrderStatus[] = [
  'offers_sent',
  'client_selected',
  'in_progress',
  'work_submitted',
]

const orderList = computed(() => orders.myOrders)

const totalOrders = computed(() => orderList.value.length)
const inProgressCount = computed(() =>
  orderList.value.filter(order => IN_PROGRESS_STATUSES.includes(order.status)).length,
)
const completedCount = computed(() =>
  orderList.value.filter(order => order.status === 'completed').length,
)
const cancelledCount = computed(() =>
  orderList.value.filter(order => order.status === 'cancelled').length,
)

const reviewsLeft = computed(() =>
  orderList.value.filter(order => order.review?.status === 'approved' || order.review?.rating),
)

const rating = computed(() => {
  if (!reviewsLeft.value.length) return '0'
  const sum = reviewsLeft.value.reduce((acc, order) => acc + (order.review?.rating ?? 0), 0)
  return (sum / reviewsLeft.value.length).toFixed(1)
})

const reviewCount = computed(() => reviewsLeft.value.length)

const stats = computed<ClientProfileStat[]>(() => [
  {
    value: totalOrders.value,
    label: props.locale.t.profile.clientStatTotal,
    icon: ShoppingBag,
  },
  {
    value: inProgressCount.value,
    label: props.locale.t.profile.clientStatInProgress,
    icon: RefreshCw,
  },
  {
    value: completedCount.value,
    label: props.locale.t.profile.clientStatCompleted,
    icon: CheckCircle2,
    tone: 'success',
  },
  {
    value: cancelledCount.value,
    label: props.locale.t.profile.clientStatCancelled,
    icon: XCircle,
    tone: 'danger',
  },
])

const platformLabel = computed(() => {
  const { years, months } = memberDuration(props.user.created_at)
  if (years > 0) {
    return props.locale.t.profile.clientMemberDuration
      .replace('{years}', String(years))
      .replace('{months}', String(months))
  }
  return props.locale.t.profile.clientMemberDurationMonths.replace('{months}', String(Math.max(months, 1)))
})

const avgOrderLabel = computed(() => {
  const prices = orderList.value
    .filter(order => order.status === 'completed')
    .map((order) => {
      const accepted = order.offers?.find(offer => offer.status === 'accepted')
      return accepted ? Number(accepted.price) : null
    })
    .filter((price): price is number => price != null && !Number.isNaN(price))

  if (!prices.length) return props.locale.t.profile.clientAvgOrderEmpty

  const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length
  if (avg >= 1_000_000) {
    return `${(avg / 1_000_000).toFixed(1)} mln so'm`
  }
  return formatPrice(avg)
})

const reviewCountLabel = computed(() =>
  `${reviewCount.value} ${props.locale.t.profile.clientReviewsUnit}`.trim(),
)

const responseTimeLabel = computed(() =>
  props.locale.t.profile.clientResponseTime.replace(
    '{minutes}',
    String(totalOrders.value > 0 ? 15 : 30),
  ),
)

const activityLabel = computed(() => props.locale.t.profile.clientAboutOnlineToday)

const recommendPercent = computed(() =>
  Math.min(98, 72 + completedCount.value * 4),
)

const isVerified = computed(() => Boolean(props.user.phone))

onMounted(() => {
  void orders.loadMyOrders()
})

function openOrder(id: number) {
  emit('navigate', `${ROUTES.orders}/${id}`)
}
</script>

<template>
  <div class="client-profile-page pb-6">
    <section class="space-y-4 px-4">
      <ClientProfileHeaderSection
        :user="user"
        :display-name="displayName"
        :locale="locale"
        :stats="stats"
        :rating="rating"
        :review-count="reviewCount"
        :is-verified="isVerified"
      />

      <ClientProfileShortcuts
        :locale="locale"
        @navigate="emit('navigate', $event)"
      />

      <ClientAboutSection
        :locale="locale"
        :platform-label="platformLabel"
        :avg-order-label="avgOrderLabel"
        :review-count-label="reviewCountLabel"
        :response-time-label="responseTimeLabel"
        :activity-label="activityLabel"
      />

      <ClientOrderHistorySection
        :locale="locale"
        :orders="orderList"
        @navigate="emit('navigate', $event)"
        @open-order="openOrder"
      />

      <ClientAgentInsightsSection
        :locale="locale"
        :recommend-percent="recommendPercent"
        :show-on-time="completedCount > 0"
      />
    </section>
  </div>
</template>
