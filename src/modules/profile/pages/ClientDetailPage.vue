<script setup lang="ts">
import { CheckCircle2, RefreshCw, ShoppingBag, UserRound, XCircle } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { memberDuration } from '@/core/lib/date'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { fullName } from '@/modules/auth/types/user'
import type { User } from '@/modules/auth/types/user'
import ProfileClientView from '@/modules/profile/components/ProfileClientView.vue'
import type { PublicClientProfileData } from '@/modules/profile/components/ProfileClientView.vue'
import { fetchPublicClient, type PublicClient } from '@/modules/profile/services/clients.service'

const props = defineProps<{ id: string }>()

const locale = useLocaleStore()
const client = ref<PublicClient | null>(null)
const loading = ref(true)

const displayName = computed(() =>
  client.value ? fullName(client.value) : '',
)

const profileUser = computed<User | null>(() => {
  if (!client.value) return null

  return {
    id: client.value.id,
    telegram_id: null,
    first_name: client.value.first_name,
    last_name: client.value.last_name,
    username: null,
    email: null,
    phone: client.value.is_verified ? 'verified' : null,
    avatar_file_id: null,
    avatar: client.value.avatar,
    role: 'client',
    role_selected_at: null,
    is_active: true,
    created_at: client.value.created_at,
    updated_at: client.value.created_at,
  }
})

const publicProfile = computed<PublicClientProfileData | null>(() => {
  if (!client.value) return null

  const { years, months } = memberDuration(client.value.created_at)
  const platformLabel = years > 0
    ? locale.t.profile.clientMemberDuration
        .replace('{years}', String(years))
        .replace('{months}', String(months))
    : locale.t.profile.clientMemberDurationMonths.replace('{months}', String(Math.max(months, 1)))

  return {
    stats: [
      {
        value: client.value.total_orders,
        label: locale.t.profile.clientStatTotal,
        icon: ShoppingBag,
      },
      {
        value: client.value.in_progress_orders,
        label: locale.t.profile.clientStatInProgress,
        icon: RefreshCw,
      },
      {
        value: client.value.completed_orders,
        label: locale.t.profile.clientStatCompleted,
        icon: CheckCircle2,
        tone: 'success',
      },
      {
        value: client.value.cancelled_orders,
        label: locale.t.profile.clientStatCancelled,
        icon: XCircle,
        tone: 'danger',
      },
    ],
    rating: client.value.rating_avg?.toFixed(1) ?? '0',
    reviewCount: client.value.rating_count,
    platformLabel,
    avgOrderLabel: locale.t.profile.clientAvgOrderEmpty,
    reviewCountLabel: `${client.value.rating_count} ${locale.t.profile.clientReviewsUnit}`.trim(),
    responseTimeLabel: locale.t.profile.clientResponseTime.replace(
      '{minutes}',
      String(client.value.total_orders > 0 ? 15 : 30),
    ),
    activityLabel: locale.t.profile.clientAboutOnlineToday,
    recommendPercent: Math.min(98, 72 + client.value.completed_orders * 4),
    showOnTime: client.value.completed_orders > 0,
    isVerified: client.value.is_verified,
  }
})

onMounted(async () => {
  try {
    client.value = await fetchPublicClient(Number(props.id))
  }
  catch {
    client.value = null
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <template v-if="loading">
      <section class="space-y-4 px-4 pt-2">
        <Skeleton class="h-44 w-full rounded-[28px]" />
        <Skeleton class="h-36 w-full rounded-[28px]" />
        <Skeleton class="h-28 w-full rounded-[28px]" />
      </section>
    </template>

    <ProfileClientView
      v-else-if="client && profileUser && publicProfile"
      :user="profileUser"
      :display-name="displayName"
      :member-since="publicProfile.platformLabel"
      :locale="locale"
      :is-own-profile="false"
      :public-profile="publicProfile"
    />

    <section
      v-else
      class="px-5 pt-4"
    >
      <EmptyState
        :icon="UserRound"
        :title="locale.t.profile.clientPageTitle"
        :description="locale.t.profile.guestBody"
      />
    </section>
  </div>
</template>
