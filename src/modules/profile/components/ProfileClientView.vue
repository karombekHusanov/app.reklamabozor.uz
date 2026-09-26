<script setup lang="ts">
import { CheckCircle2, ClipboardList, Eye, MessageCircle, PenLine, Settings } from '@lucide/vue'
import { useRoute } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import { memberDuration } from '@/core/lib/date'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { User } from '@/modules/auth/types/user'
import type { useLocaleStore } from '@/core/i18n/locale.store'
import type { OrderStatus } from '@/modules/orders/types/order'
import type { RatingInfo } from '@/modules/orders/types/order'
import { formatPrice } from '@/modules/orders/lib/order-status'
import { fetchMyRating } from '@/modules/orders/services/orders.service'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import { useHomeStore } from '@/modules/home/stores/home.store'
import ClientAboutSection from '@/modules/profile/components/client-sections/ClientAboutSection.vue'
import ClientOrderHistorySection from '@/modules/profile/components/client-sections/ClientOrderHistorySection.vue'
import ClientProfileHeaderSection from '@/modules/profile/components/client-sections/ClientProfileHeaderSection.vue'
import ClientProfileShortcuts from '@/modules/profile/components/client-sections/ClientProfileShortcuts.vue'
import ClientAttentionCard from '@/modules/profile/components/client-sections/ClientAttentionCard.vue'
import LegalEntityVerificationCard from '@/modules/profile/components/LegalEntityVerificationCard.vue'
import AgentInviteCard from '@/modules/agent/components/AgentInviteCard.vue'

const props = defineProps<{
  user: User
  displayName: string
  memberSince: string
  locale: ReturnType<typeof useLocaleStore>
}>()

const emit = defineEmits<{
  navigate: [to: string]
  logout: []
}>()

const orders = useOrdersStore()
const home = useHomeStore()
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
const completedCount = computed(() =>
  orderList.value.filter(order => order.status === 'completed').length,
)

const attentionOrder = computed(() =>
  orderList.value.find(order => ATTENTION_STATUSES.includes(order.status)) ?? null,
)

/** Day-to-day screens, one tap from the top — each with its live count. */
const tiles = computed(() => [
  { key: 'active', icon: ClipboardList, label: props.locale.t.profile.statActive, value: activeCount.value, to: ROUTES.orders },
  { key: 'done', icon: CheckCircle2, label: props.locale.t.profile.statCompletedShort, value: completedCount.value, to: ROUTES.orders },
  { key: 'chats', icon: MessageCircle, label: props.locale.t.landing.deskChats, value: home.unreadChats, to: ROUTES.chatThreads },
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
  void home.loadActivity()
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
        :stats="[]"
        :stars="myRating?.stars ?? null"
        :stars-count="myRating?.stars_count ?? 0"
        :grade="myRating?.grade ?? null"
        :is-verified="isVerified"
        show-back
      >
        <template #header-trailing>
          <button
            type="button"
            class="app-header-back pressable"
            :aria-label="locale.t.profile.clientShortcutSettings"
            @click="emit('navigate', ROUTES.settings)"
          >
            <Settings class="size-5" />
          </button>
        </template>

        <template #actions>
          <div class="cpv-actions">
            <button
              type="button"
              class="cpv-action pressable"
              @click="emit('navigate', ROUTES.profileEdit)"
            >
              <PenLine class="size-4" />
              {{ locale.t.profile.editShort }}
            </button>
            <button
              type="button"
              class="cpv-action pressable"
              @click="emit('navigate', ROUTES.clientDetail(user.id))"
            >
              <Eye class="size-4" />
              {{ locale.t.profile.viewMyPublicPage }}
            </button>
          </div>
        </template>
      </ClientProfileHeaderSection>

      <!-- Orders & chats — counts double as shortcuts -->
      <div class="cpv-tiles">
        <button
          v-for="tile in tiles"
          :key="tile.key"
          type="button"
          class="cpv-tile pressable"
          @click="emit('navigate', tile.to)"
        >
          <span class="cpv-tile__top">
            <span class="cpv-tile__ic"><component
              :is="tile.icon"
              class="size-[18px]"
            /></span>
            <span class="cpv-tile__n">{{ tile.value }}</span>
          </span>
          <span class="cpv-tile__label">{{ tile.label }}</span>
        </button>
      </div>

      <!-- What is waiting on the client right now -->
      <ClientAttentionCard
        v-if="attentionOrder"
        :order="attentionOrder"
        @open="openOrder"
      />

      <LegalEntityVerificationCard v-if="showLegalCard" />

      <ClientOrderHistorySection
        :locale="locale"
        :orders="orderList"
        @navigate="emit('navigate', $event)"
        @open-order="openOrder"
      />

      <!-- Become an agency — always shown here (hiding it is a home-only option). -->
      <AgentInviteCard
        :dismissible="false"
        @open="becomeAgent"
      />

      <!-- Account — settings & sign out -->
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
    </section>
  </div>
</template>

<style scoped>
.cpv-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
.cpv-action {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 44px; padding: 0 10px;
  border: 1px solid var(--border); border-radius: 14px; background: var(--secondary); color: var(--secondary-foreground);
  font-size: 13px; font-weight: 700; white-space: nowrap;
}
.cpv-action:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

.cpv-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.cpv-tile {
  display: flex; flex-direction: column; align-items: stretch; gap: 8px; min-width: 0; min-height: 88px; padding: 12px 11px;
  background: var(--card); border: 1px solid var(--border); border-radius: var(--rb-r-tile); box-shadow: var(--rb-elev-1);
  text-align: left; cursor: pointer;
}
.cpv-tile:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.cpv-tile__top { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.cpv-tile__ic { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 11px; background: var(--secondary); color: var(--primary); }
.cpv-tile__n { font-family: var(--rb-font-display); font-size: 20px; font-weight: 900; font-variant-numeric: tabular-nums; color: var(--foreground); }
.cpv-tile__label { font-size: 12px; font-weight: 700; line-height: 1.2; color: var(--foreground); }
</style>
