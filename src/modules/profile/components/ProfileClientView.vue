<script setup lang="ts">
import { Briefcase, CheckCircle2, ChevronRight, CreditCard, RefreshCw } from '@lucide/vue'
import { useRoute } from 'vue-router'
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
import ClientAttentionCard from '@/modules/profile/components/client-sections/ClientAttentionCard.vue'
import LegalEntityVerificationCard from '@/modules/profile/components/LegalEntityVerificationCard.vue'
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

const ACTIVE_STATUSES: OrderStatus[] = [
  'new',
  'offers_sent',
  'client_selected',
  'in_progress',
  'work_submitted',
]

/** The order that is waiting on the client right now, most recent first. */
const ATTENTION_STATUSES: OrderStatus[] = ['awaiting_payment', 'work_submitted']

const orderList = computed(() => orders.myOrders)

const activeCount = computed(() =>
  orderList.value.filter(order => ACTIVE_STATUSES.includes(order.status)).length,
)
const awaitingPaymentCount = computed(() =>
  orderList.value.filter(order => order.status === 'awaiting_payment').length,
)
const completedCount = computed(() =>
  orderList.value.filter(order => order.status === 'completed').length,
)

const attentionOrder = computed(() =>
  orderList.value.find(order => ATTENTION_STATUSES.includes(order.status)) ?? null,
)

// The counters double as navigation — every number opens the order list.
const stats = computed<ClientProfileStat[]>(() => [
  {
    value: activeCount.value,
    label: props.locale.t.profile.statActive,
    icon: RefreshCw,
    to: ROUTES.orders,
  },
  {
    value: awaitingPaymentCount.value,
    label: props.locale.t.profile.statAwaitingPayment,
    icon: CreditCard,
    tone: awaitingPaymentCount.value > 0 ? 'warning' : 'default',
    to: ROUTES.orders,
  },
  {
    value: completedCount.value,
    label: props.locale.t.profile.statCompletedShort,
    icon: CheckCircle2,
    tone: 'success',
    to: ROUTES.orders,
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

// `?tender=1` — sent here from the locked Tender tab to request tender access.
const tenderRequested = useRoute().query.tender === '1' && props.user.tender_access_status !== 'granted'

const showLegalCard = computed(() =>
  tenderRequested
  || (props.user.person_type === 'legal_entity' && !props.user.person_type_verified),
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

// Client → provider: open the agent KYC application form (`?as=agent` renders
// the agent edit/application form; submitting it starts the KYC review).
function becomeAgent() {
  emit('navigate', `${ROUTES.profileEdit}?as=agent`)
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
        <template #top />
      </ClientProfileHeaderSection>

      <!-- What is waiting on the client right now -->
      <ClientAttentionCard
        v-if="attentionOrder"
        :order="attentionOrder"
        @open="openOrder"
      />

      <!-- Zone B — at most one primary -->
      <LegalEntityVerificationCard v-if="showLegalCard" />


      <!-- Become a provider: one quiet row, not a competing block. -->
      <button
        type="button"
        class="app-list-row pressable rounded-[var(--rb-r-card)] bg-card shadow-[var(--rb-elev-1)]"
        @click="becomeAgent"
      >
        <span class="app-list-row__icon app-list-row__icon--amber">
          <Briefcase class="size-4" />
        </span>
        <span class="app-list-row__body">
          <span class="app-list-row__label">
            {{ locale.t.profile.becomeAgentTitle }}
          </span>
          <span class="app-list-row__hint">
            {{ locale.t.profile.becomeAgentCta }}
          </span>
        </span>
        <ChevronRight
          class="app-list-row__chevron"
          aria-hidden="true"
        />
      </button>

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
