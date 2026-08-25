<script setup lang="ts">
import { CheckCircle2, RefreshCw, ShoppingBag } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { memberDuration } from '@/core/lib/date'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { User } from '@/modules/auth/types/user'
import type { OrderStatus } from '@/modules/orders/types/order'
import type { RatingInfo } from '@/modules/orders/types/order'
import { formatPrice } from '@/modules/orders/lib/order-status'
import { fetchMyRating } from '@/modules/orders/services/orders.service'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import ClientAboutSection from '@/modules/profile/components/client-sections/ClientAboutSection.vue'
import ClientOrderHistorySection from '@/modules/profile/components/client-sections/ClientOrderHistorySection.vue'
import ClientProfileHeaderSection from '@/modules/profile/components/client-sections/ClientProfileHeaderSection.vue'
import ClientProfileShortcuts from '@/modules/profile/components/client-sections/ClientProfileShortcuts.vue'
import LegalEntityVerificationCard from '@/modules/profile/components/LegalEntityVerificationCard.vue'
import IdentityVerificationCard from '@/modules/profile/components/IdentityVerificationCard.vue'
import type { ClientProfileStat } from '@/modules/profile/components/client-sections/ClientProfileHeaderSection.vue'

const props = defineProps<{
  user: User
  displayName: string
  memberSince: string
  locale: any
}>()

const emit = defineEmits<{
  navigate: [to: string]
  logout: []
}>()

const orders = useOrdersStore()
const myRating = ref<RatingInfo | null>(null)

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

  if (!prices.length) return null

  const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length
  if (avg >= 1_000_000) {
    return `${(avg / 1_000_000).toFixed(1)} mln so'm`
  }
  return formatPrice(avg)
})

const completedLabel = computed(() =>
  completedCount.value > 0
    ? String(completedCount.value)
    : null,
)

const isVerified = computed(() => Boolean(props.user.phone))

const showLegalCard = computed(() =>
  props.user.person_type === 'legal_entity' && !props.user.person_type_verified,
)

onMounted(() => {
  void orders.loadMyOrders()
  void fetchMyRating(props.user.role)
    .then((rating) => { myRating.value = rating })
    .catch(() => { myRating.value = null })
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
        :stars="myRating?.stars ?? null"
        :stars-count="myRating?.stars_count ?? 0"
        :grade="myRating?.grade ?? null"
        :is-verified="isVerified"
        show-back
      >
        <template #top>        </template>
      </ClientProfileHeaderSection>

      <!-- Zone B — at most one primary -->
      <LegalEntityVerificationCard v-if="showLegalCard" />

      <!-- Optional MyID identity badge (self-manages visibility). -->
      <IdentityVerificationCard />

      <!-- Zone C — Account -->
      <ClientProfileShortcuts
        :locale="locale"
        @navigate="emit('navigate', $event)"
        @logout="emit('logout')"
      />

      <ClientAboutSection
        :locale="locale"
        :platform-label="platformLabel"
        :avg-order-label="avgOrderLabel"
        :completed-label="completedLabel"
      />

      <ClientOrderHistorySection
        :locale="locale"
        :orders="orderList"
        @navigate="emit('navigate', $event)"
        @open-order="openOrder"
      />
    </section>
  </div>
</template>
