<script setup lang="ts">
import {
  BadgeCheck,
  ChevronLeft,
  MessageCircle,
  Monitor,
  Palette,
  Printer,
  RefreshCw,
  Shield,
  ShieldCheck,
  Star,
  Users,
} from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { useLocaleStore } from '@/core/i18n/locale.store'
import Avatar from '@/core/ui/Avatar.vue'
import { Carousel, CarouselContent, CarouselItem } from '@/core/ui/carousel'
import AgentAdvantagesSection from '@/modules/profile/components/agent-sections/AgentAdvantagesSection.vue'
import AgentPortfolioSection from '@/modules/profile/components/agent-sections/AgentPortfolioSection.vue'
import AgentTestimonialsSection from '@/modules/profile/components/agent-sections/AgentTestimonialsSection.vue'
import AgentWorkflowSection from '@/modules/profile/components/agent-sections/AgentWorkflowSection.vue'

/**
 * Shared agency presentation — used both by the owner's profile view and the
 * public marketplace detail page, so the two look almost identical. Everything
 * owner- or client-specific (the CTA buttons) is injected via the `actions` slot.
 */
const props = defineProps<{
  headerTitle: string
  name: string
  logo: string | null
  subtitle: string
  isApproved: boolean
  /** Profile completeness (0-100) — drives the presentational stats + rating. */
  completion: number
  locale: ReturnType<typeof useLocaleStore>
}>()

const router = useRouter()

const ratingValue = computed(() => (4.5 + (props.completion / 100) * 0.5).toFixed(1))
const reviewCount = computed(() => Math.max(12, Math.round(props.completion * 1.28)))
const filledStars = computed(() => Math.floor(Number(ratingValue.value)))
const hasHalfStar = computed(() => Number(ratingValue.value) % 1 >= 0.25)

const reviewCountLabel = computed(() =>
  props.locale.t.profile.agentReviewCount.replace('{count}', String(reviewCount.value)),
)

const stats = computed(() => [
  {
    value: `${Math.max(1, Math.round(props.completion * 6.5))}+`,
    label: props.locale.t.profile.agentStatProjects,
    icon: Shield,
  },
  {
    value: `${Math.max(1, Math.round(props.completion * 3.2))}+`,
    label: props.locale.t.profile.agentStatClients,
    icon: Users,
  },
  {
    value: `${Math.min(99, Math.max(72, Math.round(72 + props.completion * 0.26)))}%`,
    label: props.locale.t.profile.agentStatReturn,
    icon: RefreshCw,
  },
  {
    value: `${ratingValue.value}/5`,
    label: props.locale.t.profile.agentStatRating,
    icon: MessageCircle,
  },
])

const services = computed(() => [
  {
    key: 'outdoor',
    title: props.locale.t.profile.agentServiceOutdoorTitle,
    hint: props.locale.t.profile.agentServiceOutdoorHint,
    icon: Monitor,
  },
  {
    key: 'print',
    title: props.locale.t.profile.agentServicePrintTitle,
    hint: props.locale.t.profile.agentServicePrintHint,
    icon: Printer,
  },
  {
    key: 'branding',
    title: props.locale.t.profile.agentServiceBrandingTitle,
    hint: props.locale.t.profile.agentServiceBrandingHint,
    icon: Palette,
  },
  {
    key: 'quality',
    title: props.locale.t.profile.agentServiceQualityTitle,
    hint: props.locale.t.profile.agentServiceQualityHint,
    icon: ShieldCheck,
  },
])

function goBack() {
  router.back()
}
</script>

<template>
  <div class="agent-profile-page pb-6">
    <header class="safe-top flex items-center justify-between gap-3 px-4 pt-2">
      <button
        type="button"
        class="pressable agent-profile-toolbar-btn"
        :aria-label="locale.t.common.back"
        @click="goBack"
      >
        <ChevronLeft class="size-5" />
      </button>

      <h1 class="truncate text-[1.05rem] font-semibold text-foreground">
        {{ headerTitle }}
      </h1>

      <span
        class="size-11 shrink-0"
        aria-hidden="true"
      />
    </header>

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

            <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-foreground">
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
                <span class="font-medium text-muted-foreground">{{ reviewCountLabel }}</span>
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

        <!-- Owner vs. client CTAs -->
        <div class="mt-3 flex items-stretch gap-2">
          <slot name="actions" />
        </div>
      </div>

      <div class="agent-profile-services-card px-3 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-5">
        <h3 class="pt-0.5 text-[0.9rem] font-bold text-foreground">
          {{ locale.t.profile.agentServicesTitle }}
        </h3>

        <Carousel
          class="agent-profile-carousel mt-3"
          :opts="{ align: 'start', dragFree: true, containScroll: 'trimSnaps' }"
        >
          <CarouselContent class="-ml-2.5 pl-2 pr-2">
            <CarouselItem
              v-for="service in services"
              :key="service.key"
              class="w-[8.75rem] shrink-0 grow-0 basis-[8.75rem] pl-2.5"
            >
              <div class="agent-profile-service">
                <span class="agent-profile-service__icon">
                  <component
                    :is="service.icon"
                    class="size-[1.15rem]"
                  />
                </span>
                <p class="mt-2 text-[12px] font-bold leading-tight text-foreground">
                  {{ service.title }}
                </p>
                <p class="mt-1 text-[9px] leading-snug text-muted-foreground">
                  {{ service.hint }}
                </p>
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>

      <AgentPortfolioSection />
      <AgentAdvantagesSection />
      <AgentTestimonialsSection />
      <AgentWorkflowSection />
    </section>
  </div>
</template>
