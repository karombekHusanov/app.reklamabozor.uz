<script setup lang="ts">
import {
  BadgeCheck,
  ShoppingBag,
  Star,
  TrendingUp,
} from '@lucide/vue'
import { computed } from 'vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import Avatar from '@/core/ui/Avatar.vue'
import PersonTypeBadge from '@/core/ui/PersonTypeBadge.vue'
import { gradeLabelForScore } from '@/core/lib/rating'
import type { User } from '@/modules/auth/types/user'
import type { useLocaleStore } from '@/core/i18n/locale.store'

export interface ClientProfileStat {
  value: number
  label: string
  icon: typeof ShoppingBag
  tone?: 'default' | 'success' | 'danger' | 'warning'
  /** When set the tile is a button into that route. */
  to?: string
}

const emit = defineEmits<{ select: [to: string] }>()

const props = withDefaults(defineProps<{
  user: Pick<User, 'avatar'> & Partial<Pick<User, 'person_type' | 'person_type_verified' | 'legal_entity_status'>>
  displayName: string
  locale: ReturnType<typeof useLocaleStore>
  stats: ClientProfileStat[]
  /** Stars from /me/rating (own) or public API. */
  stars?: number | null
  starsCount?: number
  grade?: number | null
  /** Legacy single-number fallback for public clients without stars. */
  rating?: string | null
  reviewCount?: number
  isVerified: boolean
  showBack?: boolean
  headerTitle?: string
}>(), {
  stars: null,
  starsCount: 0,
  grade: null,
  rating: null,
  reviewCount: 0,
  showBack: false,
  headerTitle: undefined,
})

const title = computed(() => props.headerTitle ?? props.locale.t.profile.clientPageTitle)

/** Hide seeded 5.00 / empty public ratings until at least one approved review. */
const reviewCount = computed(() => props.starsCount || props.reviewCount || 0)
const hasRatedReviews = computed(() => reviewCount.value > 0)

const starsDisplay = computed(() => {
  if (!hasRatedReviews.value) return null
  if (typeof props.stars === 'number' && Number.isFinite(props.stars)) {
    return props.stars.toFixed(1)
  }
  if (props.rating && props.rating !== '0') return props.rating
  return null
})

const filledStars = computed(() =>
  starsDisplay.value ? Math.floor(Number(starsDisplay.value)) : 0,
)
const hasHalfStar = computed(() =>
  starsDisplay.value ? Number(starsDisplay.value) % 1 >= 0.25 : false,
)

const reviewCountLabel = computed(() => {
  if (!hasRatedReviews.value) return null
  return props.locale.t.profile.clientReviewCount.replace('{count}', String(reviewCount.value))
})

const showGrade = computed(() =>
  hasRatedReviews.value && props.grade != null && Number.isFinite(props.grade),
)

const gradeLabel = computed(() => {
  if (!showGrade.value || props.grade == null) return null
  return gradeLabelForScore(props.grade, props.locale.t.rating.gradeLabel)
})

function gradeColor(grade: number) {
  if (grade >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (grade >= 60) return 'text-primary'
  if (grade >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-destructive'
}

function gradeChip(grade: number) {
  if (grade >= 80) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  if (grade >= 60) return 'bg-primary/10 text-primary'
  if (grade >= 40) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
  return 'bg-destructive/10 text-destructive'
}

const statsGridClass = computed(() => {
  const n = props.stats.length
  if (n <= 1) return 'grid-cols-1'
  if (n === 2) return 'grid-cols-2'
  if (n === 3) return 'grid-cols-3'
  return 'grid-cols-4'
})

function statIconClass(tone?: ClientProfileStat['tone']) {
  if (tone === 'success') return 'text-emerald-600 dark:text-emerald-400'
  if (tone === 'danger') return 'text-red-600 dark:text-red-400'
  if (tone === 'warning') return 'text-accent-foreground'
  return 'text-muted-foreground'
}

function statValueClass(tone?: ClientProfileStat['tone']) {
  if (tone === 'warning') return 'text-accent-foreground'
  return 'text-foreground'
}
</script>

<template>
  <div class="client-profile-hero">
    <AppHeader
      :title="title"
      :show-back="showBack"
      class="client-profile-hero__header"
    >
      <template
        v-if="$slots['header-trailing']"
        #trailing
      >
        <slot name="header-trailing" />
      </template>
    </AppHeader>

    <slot name="top" />

    <div class="agent-profile-card overflow-hidden p-4">
      <div class="flex items-start gap-3">
        <div class="relative shrink-0">
          <Avatar
            :src="user.avatar"
            :name="displayName"
            size="xl"
            class="!size-[4.25rem] !rounded-full !text-base ring-[3px] ring-card"
          />
        </div>

        <div class="min-w-0 flex-1 pt-0.5">
          <h2 class="truncate text-[1.02rem] font-extrabold leading-tight tracking-tight text-foreground">
            {{ displayName }}
          </h2>

          <p
            v-if="isVerified"
            class="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary"
          >
            <BadgeCheck class="size-3.5 fill-primary/15" />
            {{ locale.t.profile.clientVerified }}
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
                v-if="reviewCountLabel"
                class="font-medium text-muted-foreground"
              >{{ reviewCountLabel }}</span>
            </span>

            <span
              v-if="showGrade && grade != null"
              class="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              :class="gradeChip(grade)"
            >
              <TrendingUp
                class="size-3"
                :class="gradeColor(grade)"
              />
              {{ grade }}
              <span
                v-if="gradeLabel"
                class="font-semibold opacity-80"
              >{{ gradeLabel }}</span>
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="stats.length"
        class="mt-3 grid gap-1.5 border-t border-border/60 pt-3"
        :class="statsGridClass"
      >
        <component
          :is="item.to ? 'button' : 'div'"
          v-for="item in stats"
          :key="item.label"
          :type="item.to ? 'button' : undefined"
          class="rounded-2xl border border-border/60 bg-muted/20 px-2 py-2.5 text-center transition"
          :class="item.to ? 'pressable active:scale-[0.97]' : ''"
          @click="item.to && emit('select', item.to)"
        >
          <component
            :is="item.icon"
            class="mx-auto size-3.5"
            :class="statIconClass(item.tone)"
          />
          <p
            class="rb-font-display mt-1 text-[19px] font-extrabold tabular-nums leading-none"
            :class="statValueClass(item.tone)"
          >
            {{ item.value }}
          </p>
          <p class="mt-1 line-clamp-2 text-[10.5px] font-medium leading-snug text-muted-foreground">
            {{ item.label }}
          </p>
        </component>
      </div>

      <!-- Owner-only actions (edit, public page) -->
      <slot name="actions" />
    </div>
  </div>
</template>
