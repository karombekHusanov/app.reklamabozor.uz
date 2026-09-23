<script setup lang="ts">
import { ChevronRight, CircleX, ClipboardList, Clock, Eye, Inbox, PenLine, Settings, ShieldCheck, Star, Wallet } from '@lucide/vue'
import { useRoute } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import Avatar from '@/core/ui/Avatar.vue'
import PersonTypeBadge from '@/core/ui/PersonTypeBadge.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { categoryName } from '@/core/i18n/category-name'
import { gradeLabelForScore } from '@/core/lib/rating'
import type { User } from '@/modules/auth/types/user'
import type { AgentProfile } from '@/modules/agent/types/agent'
import type { useLocaleStore } from '@/core/i18n/locale.store'
import { fetchMyRating } from '@/modules/orders/services/orders.service'
import type { RatingInfo } from '@/modules/orders/types/order'
import AgentProfileShortcuts from '@/modules/profile/components/agent-sections/AgentProfileShortcuts.vue'
import LegalEntityVerificationCard from '@/modules/profile/components/LegalEntityVerificationCard.vue'
import PropuskCard from '@/modules/agent/components/PropuskCard.vue'
import ProviderPortfolioCard from '@/modules/profile/components/ProviderPortfolioCard.vue'
import { fetchEarnings } from '@/modules/profile/services/earnings.service'
import { earningsStrings } from '@/modules/profile/lib/earnings-i18n'
import { formatPrice } from '@/modules/orders/lib/order-status'
import { ROUTES } from '@/modules/shell/constants/routes'

const props = defineProps<{
  user: User
  profile: AgentProfile | null
  displayName: string
  memberSince: string
  locale: ReturnType<typeof useLocaleStore>
  loading?: boolean
}>()

const emit = defineEmits<{
  navigate: [to: string]
  logout: []
}>()

const myRating = ref<RatingInfo | null>(null)

async function loadMyRating() {
  try {
    myRating.value = await fetchMyRating(props.user.role)
  }
  catch {
    myRating.value = null
  }
}

/** Available balance, shown on the Earnings tile. */
const balanceSom = ref<number | null>(null)

async function loadBalance() {
  try {
    balanceSom.value = (await fetchEarnings()).balance.available_som ?? 0
  }
  catch {
    balanceSom.value = null
  }
}

onMounted(() => {
  void loadMyRating()
})

// The profile may arrive after mount — fetch the balance once it's approved.
watch(
  () => props.profile?.status === 'approved',
  (approved) => { if (approved && balanceSom.value == null) void loadBalance() },
  { immediate: true },
)

watch(
  () => props.user.role,
  () => {
    void loadMyRating()
  },
)

const title = computed(() => props.profile?.company_name || props.displayName)

const subtitle = computed(() => {
  if (props.profile?.bio) return props.profile.bio
  const labels = props.profile?.categories.map(c => categoryName(c, props.locale.locale)) ?? []
  if (labels.length) {
    const categories = labels.slice(0, 2).join(' & ')
    const key = props.user.role === 'designer'
      ? props.locale.t.profile.designerCategoriesLine
      : props.locale.t.profile.agentCategoriesLine
    return key.replace('{categories}', categories)
  }
  return props.locale.t.profile.agentFallbackBody
})

const isApproved = computed(() => props.profile?.status === 'approved')
const needsVerification = computed(() => !props.profile || props.profile.status !== 'approved')

const pageTitle = computed(() =>
  props.user.role === 'designer'
    ? props.locale.t.profile.designerPageTitle
    : props.locale.t.profile.agentPageTitle,
)

const hasRatedReviews = computed(() => (myRating.value?.stars_count ?? 0) > 0)

const starsDisplay = computed(() => {
  if (!hasRatedReviews.value) return null
  const stars = myRating.value?.stars
  return typeof stars === 'number' && Number.isFinite(stars) ? stars.toFixed(1) : null
})


const grade = computed(() => {
  if (!hasRatedReviews.value) return null
  return myRating.value?.grade ?? null
})
const gradeLabel = computed(() => {
  if (grade.value == null) return null
  return gradeLabelForScore(grade.value, props.locale.t.rating.gradeLabel)
})

function gradeChip(g: number) {
  if (g >= 80) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  if (g >= 60) return 'bg-primary/10 text-primary'
  if (g >= 40) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
  return 'bg-destructive/10 text-destructive'
}

const verifyMeta = computed(() => {
  const status = props.profile?.status
  if (status === 'pending') {
    return {
      icon: Clock,
      badge: props.locale.t.profile.agentShortcutVerifyStatusLabel,
      title: props.locale.t.agent.statusPending,
      hint: props.locale.t.agent.statusPendingMsg,
      tone: 'agent-verify-cta--pending',
      pulse: false,
    }
  }
  if (status === 'rejected') {
    return {
      icon: CircleX,
      badge: props.locale.t.profile.agentShortcutVerifyStatusLabel,
      title: props.locale.t.agent.statusRejected,
      hint: props.profile?.rejection_reason?.trim() || props.locale.t.agent.statusRejectedMsg,
      tone: 'agent-verify-cta--rejected',
      pulse: false,
    }
  }
  return {
    icon: ShieldCheck,
    badge: props.locale.t.profile.agentShortcutVerifyBadge,
    title: props.locale.t.profile.agentShortcutVerify,
    hint: props.locale.t.profile.agentShortcutVerifyHint,
    tone: '',
    pulse: true,
  }
})

/** Zone B: at most one primary next action. */
const showKycCta = computed(() => needsVerification.value)
// `?tender=1` — sent here from the locked Tender tab to request tender access.
const tenderRequested = useRoute().query.tender === '1' && props.user.tender_access_status !== 'granted'

const showLegalCard = computed(() =>
  tenderRequested
  || (!showKycCta.value
    && props.user.person_type === 'legal_entity'
    && !props.user.person_type_verified),
)

const publicPagePath = computed(() =>
  props.profile?.id ? `/agents/${props.profile.id}` : null,
)

/** Public-page completeness — only surfaced while something is missing. */
const completion = computed(() => props.profile?.completion_percent ?? 0)
const profileIncomplete = computed(() => {
  const p = props.profile
  if (!p) return false
  return !p.company_logo || !p.bio || !p.categories.length || !p.portfolio.length || !p.results_text || !p.location_label
})

/** Day-to-day screens, one tap from the top of the page. */
const activity = computed(() => [
  { key: 'offers', icon: Inbox, label: props.locale.t.profile.agentShortcutOffers, sub: null as string | null, to: ROUTES.offers },
  { key: 'orders', icon: ClipboardList, label: props.locale.t.profile.agentShortcutOrders, sub: null as string | null, to: ROUTES.orders },
  {
    key: 'earnings',
    icon: Wallet,
    label: earningsStrings(props.locale.locale).title,
    sub: balanceSom.value != null ? formatPrice(balanceSom.value) : null,
    to: ROUTES.earnings,
  },
])

const statusLabel = computed(() => {
  if (!props.profile) return props.locale.t.profile.notStarted
  return props.locale.t.profile.agentStatus[props.profile.status] ?? props.profile.status
})
</script>

<template>
  <div class="agent-profile-page pb-6">
    <AppHeader
      :title="pageTitle"
      show-back
    >
      <template #trailing>
        <button
          type="button"
          class="app-header-back pressable"
          :aria-label="locale.t.profile.agentShortcutSettings"
          @click="emit('navigate', ROUTES.settings)"
        >
          <Settings class="size-5" />
        </button>
      </template>
    </AppHeader>

    <template v-if="loading && !profile">
      <section class="space-y-4 px-4 pt-3">
        <Skeleton class="h-40 w-full rounded-[28px]" />
        <Skeleton class="h-24 w-full rounded-[28px]" />
        <Skeleton class="h-32 w-full rounded-[28px]" />
      </section>
    </template>

    <section
      v-else
      class="space-y-4 px-4 pt-3"
    >
      <!-- Zone A — Identity -->
      <div class="agent-profile-card overflow-hidden p-4">
        <div class="flex items-start gap-3">
          <div class="relative shrink-0">
            <Avatar
              :src="profile?.company_logo ?? user.avatar"
              :name="title"
              size="xl"
              class="!size-[4.25rem] !rounded-full !text-base ring-[3px] ring-card"
            />
            <span
              v-if="isApproved"
              class="absolute bottom-0 right-0 size-4 rounded-full border-[2.5px] border-card bg-emerald-500"
              aria-hidden="true"
            />
          </div>

          <div class="min-w-0 flex-1 pt-0.5">
            <div class="flex items-start gap-1">
              <h2 class="truncate text-[1.02rem] font-extrabold uppercase leading-tight tracking-tight text-foreground">
                {{ title }}
              </h2>
              <ShieldCheck
                v-if="isApproved"
                class="mt-0.5 size-[1.05rem] shrink-0 fill-primary/15 text-primary"
              />
            </div>

            <p class="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
              {{ subtitle }}
            </p>

            <p class="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {{ statusLabel }}
            </p>

            <PersonTypeBadge
              v-if="user.person_type"
              :type="user.person_type"
              :verified="user.person_type_verified"
              :status="user.legal_entity_status"
              class="mt-1.5"
            />
          </div>
        </div>

        <!-- Reputation: two numbers, each with what it measures -->
        <div
          v-if="starsDisplay || grade != null"
          class="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3"
        >
          <div
            v-if="starsDisplay"
            class="space-y-0.5"
          >
            <p class="flex items-center gap-1.5">
              <Star class="size-[15px] fill-amber-400 text-amber-400" />
              <span class="rb-font-display text-[18px] font-extrabold tabular-nums leading-none text-foreground">{{ starsDisplay }}</span>
              <span
                v-if="myRating?.stars_count"
                class="text-[11.5px] text-muted-foreground"
              >{{ locale.t.profile.agentReviewCount.replace('{count}', String(myRating.stars_count)) }}</span>
            </p>
            <p class="text-[11px] text-muted-foreground">
              {{ locale.t.profile.reputationRating }}
            </p>
          </div>

          <div
            v-if="grade != null"
            class="space-y-0.5"
          >
            <p class="flex items-center gap-1.5">
              <span class="rb-font-display text-[18px] font-extrabold tabular-nums leading-none text-foreground">{{ grade }}</span>
              <span
                v-if="gradeLabel"
                class="inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-bold"
                :class="gradeChip(grade)"
              >{{ gradeLabel }}</span>
            </p>
            <p class="text-[11px] text-muted-foreground">
              {{ locale.t.profile.reputationGrade }}
            </p>
          </div>
        </div>

        <!-- Profile actions live on the identity card itself -->
        <div
          v-if="profile"
          class="apv-actions"
        >
          <button
            type="button"
            class="apv-action pressable"
            @click="emit('navigate', ROUTES.profileEdit)"
          >
            <PenLine class="size-4" />
            {{ locale.t.profile.editShort }}
          </button>
          <button
            v-if="isApproved && publicPagePath"
            type="button"
            class="apv-action pressable"
            @click="emit('navigate', publicPagePath)"
          >
            <Eye class="size-4" />
            {{ locale.t.profile.viewMyPublicPage }}
          </button>
        </div>

        <button
          v-if="isApproved && profileIncomplete"
          type="button"
          class="apv-complete pressable"
          @click="emit('navigate', ROUTES.profileEdit)"
        >
          <span class="apv-complete__row">
            <span>{{ locale.t.profile.completeLine.replace('{percent}', String(completion)) }}</span>
            <span class="apv-complete__cta">{{ locale.t.profile.publicPageFill }} <ChevronRight class="size-3.5" /></span>
          </span>
          <span class="apv-complete__bar"><span :style="{ width: `${completion}%` }" /></span>
        </button>
      </div>

      <!-- Activity — the screens a provider opens every day -->
      <div
        v-if="isApproved"
        class="apv-tiles"
      >
        <button
          v-for="tile in activity"
          :key="tile.key"
          type="button"
          class="apv-tile pressable"
          @click="emit('navigate', tile.to)"
        >
          <span class="apv-tile__ic"><component
            :is="tile.icon"
            class="size-[18px]"
          /></span>
          <span class="apv-tile__label">{{ tile.label }}</span>
          <span
            v-if="tile.sub"
            class="apv-tile__sub"
          >{{ tile.sub }}</span>
        </button>
      </div>

      <PropuskCard v-if="isApproved" />

      <ProviderPortfolioCard
        v-if="isApproved && profile"
        :items="profile.portfolio"
        @navigate="emit('navigate', $event)"
      />

      <!-- Zone B — at most one primary next action -->
      <button
        v-if="showKycCta"
        type="button"
        class="agent-verify-cta pressable"
        :class="verifyMeta.tone"
        @click="emit('navigate', `${ROUTES.profileEdit}?as=agent`)"
      >
        <span class="agent-verify-cta__icon">
          <span
            v-if="verifyMeta.pulse"
            class="agent-verify-cta__icon-pulse"
            aria-hidden="true"
          />
          <component
            :is="verifyMeta.icon"
            class="relative size-5"
          />
        </span>
        <span class="agent-verify-cta__copy">
          <span class="agent-verify-cta__badge">{{ verifyMeta.badge }}</span>
          <span class="agent-verify-cta__title">{{ verifyMeta.title }}</span>
          <span class="agent-verify-cta__hint">{{ verifyMeta.hint }}</span>
        </span>
        <ChevronRight
          class="agent-verify-cta__chevron"
          aria-hidden="true"
        />
      </button>

      <LegalEntityVerificationCard v-else-if="showLegalCard" />

      <!-- Account — settings & sign out -->
      <AgentProfileShortcuts
        :locale="locale"
        @navigate="emit('navigate', $event)"
        @logout="emit('logout')"
      />
    </section>
  </div>
</template>

<style scoped>
.apv-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
.apv-action {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 44px; padding: 0 10px;
  border: 1px solid var(--border); border-radius: 14px; background: var(--secondary); color: var(--secondary-foreground);
  font-size: 13px; font-weight: 700; white-space: nowrap;
}
.apv-action:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

.apv-complete { display: block; width: 100%; margin-top: 12px; padding: 0; border: 0; background: none; text-align: left; cursor: pointer; }
.apv-complete__row { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--muted-foreground); }
.apv-complete__cta { display: inline-flex; align-items: center; gap: 2px; font-weight: 700; color: var(--primary); }
.apv-complete__bar { display: block; height: 5px; margin-top: 6px; overflow: hidden; border-radius: 999px; background: var(--muted); }
.apv-complete__bar span { display: block; height: 100%; border-radius: inherit; background: var(--primary); }

.apv-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.apv-tile {
  display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-width: 0; min-height: 96px; padding: 12px 11px;
  background: var(--card); border: 1px solid var(--border); border-radius: var(--rb-r-tile); box-shadow: var(--rb-elev-1);
  text-align: left; cursor: pointer;
}
.apv-tile:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.apv-tile__ic { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 11px; background: var(--secondary); color: var(--primary); }
.apv-tile__label { font-size: 12.5px; font-weight: 700; line-height: 1.2; color: var(--foreground); }
.apv-tile__sub { margin-top: auto; font-family: var(--rb-font-display); font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
</style>
