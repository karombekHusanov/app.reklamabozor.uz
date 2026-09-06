<script setup lang="ts">
import { ChevronRight, CircleX, Clock, LayoutGrid, Shield, ShieldCheck, Star } from '@lucide/vue'
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
import AgentProfileCompletionBar from '@/modules/profile/components/edit/AgentProfileCompletionBar.vue'
import LegalEntityVerificationCard from '@/modules/profile/components/LegalEntityVerificationCard.vue'
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

onMounted(() => {
  void loadMyRating()
})

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

const completion = computed(() => props.profile?.completion_percent ?? 0)
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

const filledStars = computed(() => (starsDisplay.value ? Math.floor(Number(starsDisplay.value)) : 0))
const hasHalfStar = computed(() =>
  starsDisplay.value ? Number(starsDisplay.value) % 1 >= 0.25 : false,
)

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

const stats = computed(() => {
  const items = [
    {
      value: String(props.profile?.categories.length ?? 0),
      label: props.locale.t.profile.agentStatsServices,
      icon: LayoutGrid,
    },
    {
      value: `${completion.value}%`,
      label: props.locale.t.profile.agentStatsProfile,
      icon: Shield,
    },
  ]

  if (starsDisplay.value) {
    items.push({
      value: starsDisplay.value,
      label: props.locale.t.profile.agentStatRating,
      icon: Star,
    })
  }

  return items
})

const statsGridClass = computed(() => {
  const n = stats.value.length
  if (n <= 2) return 'grid-cols-2'
  return 'grid-cols-3'
})

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
const showLegalCard = computed(() =>
  !showKycCta.value
  && props.user.person_type === 'legal_entity'
  && !props.user.person_type_verified,
)
const showCompletionBar = computed(() =>
  !showKycCta.value
  && !showLegalCard.value
  && isApproved.value
  && completion.value < 100,
)

const publicPagePath = computed(() =>
  props.profile?.id ? `/agents/${props.profile.id}` : null,
)

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
    />

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

            <div
              v-if="starsDisplay"
              class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-foreground"
            >
              <span class="inline-flex items-center gap-1">
                <span class="flex items-center">
                  <Star
                    v-for="n in 5"
                    :key="n"
                    class="size-3.5"
                    :class="[
                      n <= filledStars
                        ? 'fill-amber-400 text-amber-400'
                        : n === filledStars + 1 && hasHalfStar
                          ? 'fill-amber-400/45 text-amber-400'
                          : 'fill-muted/30 text-muted/30',
                    ]"
                  />
                </span>
                <span>{{ starsDisplay }}</span>
                <span
                  v-if="myRating?.stars_count"
                  class="font-medium text-muted-foreground"
                >
                  {{ locale.t.profile.agentReviewCount.replace('{count}', String(myRating.stars_count)) }}
                </span>
              </span>

              <span
                v-if="grade != null"
                class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                :class="gradeChip(grade)"
              >
                {{ grade }}
                <span
                  v-if="gradeLabel"
                  class="ml-0.5 font-semibold opacity-80"
                >{{ gradeLabel }}</span>
              </span>
            </div>
          </div>
        </div>

        <div
          class="mt-3 grid gap-1.5"
          :class="statsGridClass"
        >
          <div
            v-for="item in stats"
            :key="item.label"
            class="rounded-2xl border border-border/60 bg-muted/20 px-2 py-2.5 text-center"
          >
            <component
              :is="item.icon"
              class="mx-auto size-3.5 text-muted-foreground"
            />
            <p class="mt-1 text-sm font-bold tabular-nums text-foreground">
              {{ item.value }}
            </p>
            <p class="mt-0.5 text-[10px] leading-snug text-muted-foreground">
              {{ item.label }}
            </p>
          </div>
        </div>
      </div>

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

      <button
        v-else-if="showCompletionBar"
        type="button"
        class="w-full text-left pressable"
        @click="emit('navigate', ROUTES.profileEdit)"
      >
        <AgentProfileCompletionBar :percent="completion" />
      </button>


      <!-- Zone C — Account list -->
      <AgentProfileShortcuts
        :locale="locale"
        @navigate="emit('navigate', $event)"
        @logout="emit('logout')"
      />

      <!-- Zone D — Public page link -->
      <button
        v-if="isApproved && publicPagePath"
        type="button"
        class="app-list-row pressable"
        @click="emit('navigate', publicPagePath)"
      >
        <span class="app-list-row__icon app-list-row__icon--amber">
          <LayoutGrid class="size-4" />
        </span>
        <span class="app-list-row__body">
          <span class="app-list-row__label">
            {{ locale.t.profile.viewMyPublicPage }}
          </span>
          <span class="app-list-row__hint">
            {{ locale.t.profile.viewMyPublicPageHint }}
          </span>
        </span>
        <ChevronRight
          class="app-list-row__chevron"
          aria-hidden="true"
        />
      </button>
    </section>
  </div>
</template>
