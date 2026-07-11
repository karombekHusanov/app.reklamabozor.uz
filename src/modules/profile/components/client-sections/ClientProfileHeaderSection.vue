<script setup lang="ts">
import {
  BadgeCheck,
  ShoppingBag,
  Star,
} from '@lucide/vue'
import { computed } from 'vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import Avatar from '@/core/ui/Avatar.vue'
import type { User } from '@/modules/auth/types/user'

export interface ClientProfileStat {
  value: number
  label: string
  icon: typeof ShoppingBag
  tone?: 'default' | 'success' | 'danger'
}

const props = defineProps<{
  user: Pick<User, 'avatar'>
  displayName: string
  locale: any
  stats: ClientProfileStat[]
  rating: string
  reviewCount: number
  isVerified: boolean
}>()

const reviewCountLabel = computed(() =>
  props.locale.t.profile.clientReviewCount.replace('{count}', String(props.reviewCount)),
)

const filledStars = computed(() => Math.floor(Number(props.rating)))
const hasHalfStar = computed(() => Number(props.rating) % 1 >= 0.25)

function statIconClass(tone?: ClientProfileStat['tone']) {
  if (tone === 'success') return '!border-emerald-500/20 !bg-emerald-500/8 !text-emerald-600'
  if (tone === 'danger') return '!border-red-500/20 !bg-red-500/8 !text-red-600'
  return ''
}
</script>

<template>
  <div class="client-profile-hero">
    <AppHeader
      :title="locale.t.profile.clientPageTitle"
      show-back
      class="client-profile-hero__header"
    />

    <div class="home-card p-3 sm:p-4">
      <div class="flex items-start gap-3">
        <div class="relative shrink-0">
          <Avatar
            :src="user.avatar"
            :name="displayName"
            size="xl"
            class="!size-[4.25rem] !rounded-full !text-base ring-[3px] ring-card"
          />
          <span
            v-if="isVerified"
            class="absolute bottom-0 right-0 size-4 rounded-full border-[2.5px] border-card bg-emerald-500"
            aria-hidden="true"
          />
        </div>

        <div class="min-w-0 flex-1 pt-0.5">
          <h2 class="truncate text-[1.02rem] font-extrabold uppercase leading-tight tracking-tight text-foreground">
            {{ displayName }}
          </h2>

          <p
            v-if="isVerified"
            class="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary"
          >
            <BadgeCheck class="size-3.5 fill-primary/15" />
            {{ locale.t.profile.clientVerified }}
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
              <span>{{ rating }}</span>
              <span class="font-medium text-muted-foreground">{{ reviewCountLabel }}</span>
            </span>
          </div>
        </div>
      </div>

      <div class="mt-3 grid grid-cols-4 gap-1.5">
        <div
          v-for="item in stats"
          :key="item.label"
          class="client-profile-stat"
        >
          <span class="client-profile-stat__icon" :class="statIconClass(item.tone)">
            <component :is="item.icon" class="size-3.5" />
          </span>
          <p class="mt-1.5 text-[12px] font-bold leading-none text-foreground">
            {{ item.value }}
          </p>
          <p class="mt-0.5 line-clamp-3 px-0.5 text-[10px] leading-snug text-muted-foreground">
            {{ item.label }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
