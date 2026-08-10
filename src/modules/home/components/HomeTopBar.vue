<script setup lang="ts">
import { computed } from 'vue'
import { Bell, Star } from '@lucide/vue'
import Avatar from '@/core/ui/Avatar.vue'
import BrandLogo from '@/core/ui/BrandLogo.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import HomeMenuDropdown from '@/modules/home/components/HomeMenuDropdown.vue'
import type { RatingInfo } from '@/modules/orders/types/order'

const props = defineProps<{
  displayName: string
  avatarSrc?: string | null
  isAuthenticated: boolean
  notificationCount?: number
  activeRole?: string
  rating?: RatingInfo | null
  isProvider?: boolean
  offersCount?: number
  chatsUnread?: number
}>()

const emit = defineEmits<{
  profile: []
  notifications: []
  navigate: [to: string]
}>()

const locale = useLocaleStore()

const activeRoleLabel = computed(() => {
  if (!props.activeRole || props.activeRole === 'admin' || props.activeRole === 'seller') {
    return null
  }
  return (locale.t.roles as Record<string, string>)[props.activeRole] ?? props.activeRole
})

const starsDisplay = computed(() => {
  const stars = props.rating?.stars
  return typeof stars === 'number' && Number.isFinite(stars) ? stars.toFixed(1) : null
})

const gradeDisplay = computed(() => {
  const grade = props.rating?.grade
  return typeof grade === 'number' && Number.isFinite(grade) ? Math.round(grade) : null
})
</script>

<template>
  <header class="home-topbar safe-top">
    <!-- Top chrome: menu · brand · notifications -->
    <div class="home-topbar__chrome">
      <HomeMenuDropdown
        :is-provider="Boolean(isProvider)"
        :offers-count="offersCount"
        :chats-unread="chatsUnread"
        @navigate="emit('navigate', $event)"
      />

      <BrandLogo
        size="sm"
        :wordmark="false"
        class="home-topbar__logo"
      />

      <button
        type="button"
        class="pressable home-icon-btn relative"
        :aria-label="locale.t.home.notificationsButton"
        @click="emit('notifications')"
      >
        <Bell class="size-5" />
        <span
          v-if="notificationCount && notificationCount > 0"
          class="absolute right-2.5 top-2.5 size-2 rounded-full bg-destructive"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- Identity strip (unchanged) -->
    <div class="home-topbar__identity-row">
      <button
        type="button"
        class="home-topbar__avatar pressable"
        :aria-label="locale.t.home.goToProfile"
        @click="emit('profile')"
      >
        <Avatar
          v-if="isAuthenticated"
          :src="avatarSrc"
          :name="displayName"
          size="md"
          class="!size-11 !rounded-full"
        />
        <span
          v-else
          class="home-topbar__avatar-fallback"
        >
          {{ displayName.charAt(0).toUpperCase() }}
        </span>
      </button>

      <div class="home-topbar__identity">
        <button
          type="button"
          class="home-topbar__name pressable"
          :aria-label="locale.t.home.goToProfile"
          @click="emit('profile')"
        >
          {{ displayName }}
        </button>

        <div
          v-if="starsDisplay || activeRoleLabel"
          class="home-topbar__meta"
        >
          <span
            v-if="starsDisplay"
            class="home-topbar__rating"
          >
            <Star class="size-3.5 fill-amber-400 text-amber-400" />
            <span class="tabular-nums">{{ starsDisplay }}</span>
            <template v-if="gradeDisplay != null">
              <span
                class="home-topbar__rating-sep"
                aria-hidden="true"
              >·</span>
              <span class="home-topbar__grade tabular-nums">{{ gradeDisplay }}</span>
            </template>
          </span>

          <template v-if="starsDisplay && activeRoleLabel">
            <span
              class="home-topbar__meta-sep"
              aria-hidden="true"
            >·</span>
          </template>

          <span
            v-if="activeRoleLabel"
            class="home-topbar__role"
          >{{ activeRoleLabel }}</span>
        </div>
      </div>
    </div>
  </header>
</template>
