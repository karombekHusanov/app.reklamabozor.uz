<script setup lang="ts">
import {
  BadgeCheck,
  LayoutGrid,
  MessageCircle,
  Shield,
  Star,
} from '@lucide/vue'
import { computed } from 'vue'
import type { useLocaleStore } from '@/core/i18n/locale.store'
import type { Category } from '@/modules/agent/types/agent'
import type { PublicReview } from '@/modules/marketplace/services/agents.service'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import Avatar from '@/core/ui/Avatar.vue'
import AgentAdvantagesSection from '@/modules/profile/components/agent-sections/AgentAdvantagesSection.vue'
import AgentContactSection from '@/modules/profile/components/agent-sections/AgentContactSection.vue'
import AgentPortfolioSection from '@/modules/profile/components/agent-sections/AgentPortfolioSection.vue'
import AgentResultsSection from '@/modules/profile/components/agent-sections/AgentResultsSection.vue'
import AgentServicesSection from '@/modules/profile/components/agent-sections/AgentServicesSection.vue'
import AgentTestimonialsSection from '@/modules/profile/components/agent-sections/AgentTestimonialsSection.vue'
import AgentWorkflowSection from '@/modules/profile/components/agent-sections/AgentWorkflowSection.vue'

/**
 * Shared agency presentation — used both by the owner's profile view and the
 * public marketplace detail page. Everything owner- or client-specific (CTAs)
 * is injected via the `actions` slot.
 */
const props = defineProps<{
  headerTitle: string
  name: string
  logo: string | null
  subtitle: string
  isApproved: boolean
  bio: string | null
  locationLabel: string | null
  websiteUrl: string | null
  linkedinUrl: string | null
  resultsText: string | null
  completion: number
  completedOrdersCount: number
  ratingAvg: number | null
  ratingCount: number
  categories: Category[]
  reviews: PublicReview[]
  locale: ReturnType<typeof useLocaleStore>
}>()

const ratingValue = computed(() =>
  props.ratingAvg !== null ? props.ratingAvg.toFixed(1) : null,
)

const filledStars = computed(() => (ratingValue.value ? Math.floor(Number(ratingValue.value)) : 0))
const hasHalfStar = computed(() =>
  ratingValue.value ? Number(ratingValue.value) % 1 >= 0.25 : false,
)

const reviewCountLabel = computed(() =>
  props.ratingCount > 0
    ? props.locale.t.profile.agentReviewCount.replace('{count}', String(props.ratingCount))
    : null,
)

const stats = computed(() => [
  {
    value: String(props.completedOrdersCount),
    label: props.locale.t.profile.agentStatProjects,
    icon: Shield,
  },
  {
    value: String(props.categories.length),
    label: props.locale.t.profile.agentStatsServices,
    icon: LayoutGrid,
  },
  {
    value: `${props.completion}%`,
    label: props.locale.t.profile.agentStatsProfile,
    icon: BadgeCheck,
  },
  {
    value: ratingValue.value ? `${ratingValue.value}/5` : '—',
    label: props.locale.t.profile.agentStatRating,
    icon: MessageCircle,
  },
])

const hasContactInfo = computed(() =>
  Boolean(props.locationLabel || props.websiteUrl || props.linkedinUrl),
)

const showAboutSection = computed(() =>
  Boolean(props.bio && props.bio !== props.subtitle),
)
</script>

<template>
  <div class="agent-profile-page pb-6">
    <AppHeader
      :title="headerTitle"
      show-back
    />

    <section class="space-y-4 px-4 pt-3">
      <div class="agent-profile-card overflow-hidden p-3 sm:p-4">
        <div class="flex items-start gap-3">
          <div class="relative shrink-0">
            <Avatar
              :src="logo"
              :name="name"
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
                {{ name }}
              </h2>
              <BadgeCheck
                v-if="isApproved"
                class="mt-0.5 size-[1.05rem] shrink-0 fill-primary/15 text-primary"
              />
            </div>

            <p class="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
              {{ subtitle }}
            </p>

            <div
              v-if="ratingValue"
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
                <span>{{ ratingValue }}</span>
                <span
                  v-if="reviewCountLabel"
                  class="font-medium text-muted-foreground"
                >{{ reviewCountLabel }}</span>
              </span>

              <span
                v-if="isApproved"
                class="hidden h-3 w-px bg-border sm:inline"
                aria-hidden="true"
              />

              <span
                v-if="isApproved"
                class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
              >
                <span class="size-1.5 rounded-full bg-emerald-500" />
                {{ locale.t.profile.online }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-4 gap-1.5">
          <div
            v-for="item in stats"
            :key="item.label"
            class="agent-profile-stat"
          >
            <span class="agent-profile-stat__icon">
              <component
                :is="item.icon"
                class="size-3.5"
              />
            </span>
            <p class="mt-1.5 text-[12px] font-bold leading-none text-foreground">
              {{ item.value }}
            </p>
            <p class="mt-0.5 text-[9px] leading-tight text-muted-foreground">
              {{ item.label }}
            </p>
          </div>
        </div>

        <div class="mt-3 flex items-stretch gap-2">
          <slot name="actions" />
        </div>
      </div>

      <div
        v-if="showAboutSection"
        class="agent-profile-services-card px-3 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-5"
      >
        <h3 class="pt-0.5 text-[0.9rem] font-bold text-foreground">
          {{ locale.t.profile.agentAboutTitle }}
        </h3>
        <p class="mt-3 whitespace-pre-line text-[12px] leading-relaxed text-muted-foreground">
          {{ bio }}
        </p>
      </div>

      <AgentServicesSection :categories="categories" />

      <AgentResultsSection
        v-if="resultsText"
        :text="resultsText"
      />
      <AgentPortfolioSection />
      <AgentAdvantagesSection />
      <AgentTestimonialsSection
        v-if="reviews.length"
        :reviews="reviews"
      />
      <AgentWorkflowSection />
      <AgentContactSection
        v-if="hasContactInfo"
        :location-label="locationLabel"
        :website-url="websiteUrl"
        :linkedin-url="linkedinUrl"
      />
    </section>
  </div>
</template>
