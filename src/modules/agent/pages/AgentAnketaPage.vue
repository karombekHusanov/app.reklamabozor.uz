<script setup lang="ts">
import { BadgeCheck, Camera, ChevronRight, ExternalLink, MessageCircle, PenLine, Settings, Sparkles, Star } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { fullName } from '@/modules/auth/types/user'
import { fetchMyRating } from '@/modules/orders/services/orders.service'
import type { RatingInfo } from '@/modules/orders/types/order'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { ROUTES } from '@/modules/shell/constants/routes'

/** Agent "Profile" tab: completion prompt, identity card, profile sections. */
const locale = useLocaleStore()
const router = useRouter()
const auth = useAuthStore()
const agent = useAgentStore()

const t = computed(() => locale.t.agentHome.anketa)
const profile = computed(() => agent.profile)
const rating = ref<RatingInfo | null>(null)

const name = computed(() => profile.value?.company_name || (auth.user ? fullName(auth.user) : ''))
const approved = computed(() => profile.value?.status === 'approved')
const completion = computed(() => profile.value?.completion_percent ?? 0)
const reviews = computed(() => rating.value?.stars_count ?? 0)

const rows = computed(() => [
  { key: 'stats', label: t.value.rows.stats, value: '', to: ROUTES.earnings },
  { key: 'portfolio', label: t.value.rows.portfolio, value: String(profile.value?.portfolio.length || ''), to: ROUTES.profileEdit },
  { key: 'categories', label: t.value.rows.categories, value: String(profile.value?.categories.length || ''), to: ROUTES.profileEdit },
  { key: 'bank', label: t.value.rows.bank, value: '', to: ROUTES.profileEdit },
  {
    key: 'offer',
    label: t.value.rows.offer,
    value: profile.value?.offer?.needs_acceptance ? t.value.offerNeeded : t.value.offerAccepted,
    to: ROUTES.agentOffer,
  },
])

function go(to: string) {
  void router.push(to)
}

async function logout() {
  await auth.logout()
  agent.reset()
  await router.replace(ROUTES.home)
}

onMounted(async () => {
  void agent.loadProfile()
  try { rating.value = await fetchMyRating(auth.user?.role ?? 'agent') }
  catch { rating.value = null }
})
</script>

<template>
  <div class="pb-6">
    <AppHeader :title="t.title">
      <template #trailing>
        <button
          type="button"
          class="an-icon"
          :aria-label="locale.t.agentHome.help.settings"
          @click="go(ROUTES.settings)"
        >
          <Settings class="size-5" />
        </button>
      </template>
    </AppHeader>

    <div
      v-if="agent.isLoadingProfile && !profile"
      class="space-y-2 px-3"
    >
      <Skeleton class="h-32 w-full rounded-[20px]" />
      <Skeleton class="h-48 w-full rounded-[20px]" />
    </div>

    <template v-else>
      <section
        v-if="!approved || completion < 100"
        class="an-card"
      >
        <h2 class="an-h2">
          {{ t.completeTitle }}
        </h2>
        <p class="an-muted">
          {{ t.completeBody }}
        </p>
        <div class="an-progress">
          <span :style="{ width: `${completion}%` }" />
        </div>
        <p class="an-muted">
          {{ t.completePct.replace('{pct}', String(completion)) }}
        </p>
        <button
          type="button"
          class="an-cta"
          @click="go(approved ? ROUTES.profileEdit : `${ROUTES.profileEdit}?as=agent`)"
        >
          {{ t.complete }}
        </button>
      </section>

      <section class="an-card">
        <div class="an-id">
          <button
            type="button"
            class="an-logo"
            :aria-label="t.edit"
            @click="go(ROUTES.profileEdit)"
          >
            <Avatar
              :src="profile?.company_logo ?? auth.user?.avatar"
              :name="name"
              class="size-full rounded-[18px]"
            />
            <span class="an-logo__cam"><Camera class="size-4" /></span>
          </button>
          <ul class="an-stats">
            <li><Star class="size-5 fill-current" />{{ reviews ? rating?.stars.toFixed(1) : t.ratingNew }}</li>
            <li><MessageCircle class="size-5 fill-current" />{{ reviews ? t.reviews.replace('{count}', String(reviews)) : t.reviewsNone }}</li>
            <li class="text-muted-foreground">
              <Sparkles class="size-5" />{{ t.grade.replace('{grade}', String(rating?.grade ?? 50)) }}
            </li>
          </ul>
          <button
            v-if="profile?.id"
            type="button"
            class="an-icon"
            :aria-label="t.share"
            @click="go(`/agents/${profile.id}`)"
          >
            <ExternalLink class="size-5" />
          </button>
        </div>
        <div class="an-name">
          <span class="min-w-0 flex-1">
            <span class="an-name__title">{{ name }}</span>
            <span
              v-if="approved"
              class="an-name__ok"
            ><BadgeCheck class="size-4" />{{ t.verified }}</span>
          </span>
          <button
            type="button"
            class="an-icon"
            :aria-label="t.edit"
            @click="go(ROUTES.profileEdit)"
          >
            <PenLine class="size-5" />
          </button>
        </div>
      </section>

      <section class="an-card an-card--list">
        <button
          v-for="row in rows"
          :key="row.key"
          type="button"
          class="an-row"
          @click="go(row.to)"
        >
          <span class="flex-1">{{ row.label }}</span>
          <span
            v-if="row.value"
            class="an-row__value"
          >{{ row.value }}</span>
          <ChevronRight class="size-4 text-muted-foreground" />
        </button>
      </section>

      <section class="an-card">
        <h2 class="an-h2">
          {{ t.aboutTitle }}
        </h2>
        <p class="an-muted">
          {{ profile?.bio || t.aboutEmpty }}
        </p>
      </section>

      <button
        type="button"
        class="an-logout"
        @click="logout"
      >
        {{ t.logout }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.an-card { margin: 0 12px 10px; padding: 16px; border-radius: 20px; background: var(--card); }
.an-card--list { padding: 4px 16px; }
.an-h2 { margin: 0; font-size: 16px; font-weight: 600; }
.an-muted { margin: 6px 0 0; font-size: 13px; line-height: 1.5; color: var(--muted-foreground); }
.an-progress { height: 6px; margin-top: 12px; overflow: hidden; border-radius: 999px; background: var(--background); }
.an-progress span { display: block; height: 100%; border-radius: inherit; background: var(--success); }
.an-cta {
  margin-top: 12px; min-height: 40px; padding: 0 14px; border: 0; border-radius: 12px;
  background: var(--foreground); color: var(--background); font-family: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer;
}
.an-id { display: flex; align-items: flex-start; gap: 14px; }
.an-logo { position: relative; flex-shrink: 0; width: 104px; height: 112px; padding: 0; border: 0; background: none; cursor: pointer; }
.an-logo__cam {
  position: absolute; right: 6px; bottom: 6px; display: grid; place-items: center; width: 32px; height: 32px;
  border-radius: 10px; background: var(--card); color: var(--foreground);
}
.an-stats { display: flex; flex: 1; flex-direction: column; gap: 12px; margin: 0; padding: 10px 0 0; list-style: none; font-size: 13.5px; }
.an-stats li { display: flex; align-items: center; gap: 8px; }
.an-name { display: flex; align-items: flex-start; gap: 8px; margin-top: 14px; }
.an-name__title { display: block; font-size: 19px; font-weight: 600; line-height: 1.25; }
.an-name__ok { display: inline-flex; align-items: center; gap: 4px; margin-top: 4px; font-size: 12.5px; font-weight: 600; color: var(--success); }
.an-icon {
  display: grid; place-items: center; width: 44px; height: 44px; flex-shrink: 0; margin: -8px -8px 0 0;
  border: 0; border-radius: 12px; background: none; color: var(--foreground); cursor: pointer;
}
.an-row {
  display: flex; width: 100%; min-height: 50px; align-items: center; gap: 10px; padding: 0;
  border: 0; background: none; color: var(--foreground); font-family: inherit; font-size: 14.5px; text-align: left; cursor: pointer;
}
.an-row + .an-row { border-top: 1px solid var(--border); }
.an-row__value { font-size: 12.5px; font-weight: 600; color: var(--muted-foreground); }
.an-logout {
  display: block; margin: 6px auto 0; min-height: 44px; padding: 0 16px; border: 0; background: none;
  color: var(--destructive); font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
}
.an-row:focus-visible, .an-icon:focus-visible, .an-cta:focus-visible, .an-logo:focus-visible, .an-logout:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
</style>
