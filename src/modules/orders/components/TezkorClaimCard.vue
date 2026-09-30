<script setup lang="ts">
import { Loader2, MessageCircle, Phone, Star } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useToast } from '@/core/composables/useToast'
import { getApiErrorMessage } from '@/core/api/api-error'
import { openOrderChat } from '@/modules/chat/services/chat.service'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { Offer, Order } from '@/modules/orders/types/order'

/**
 * Tezkor on the client's order, once the client picked an agency
 * ("Kelishildi"): that agency and how to reach it. The otklik list itself
 * lives on the order page (OfferListItem → chat → pick).
 */
const props = defineProps<{
  order: Order
}>()

const locale = useLocaleStore()
const router = useRouter()
const toast = useToast()

const claim = computed(() => props.order.claim ?? null)
const agent = computed(() => claim.value?.agent ?? null)

const displayName = computed(() => {
  const a = agent.value
  if (!a) return ''
  return a.company_name || [a.first_name, a.last_name].filter(Boolean).join(' ')
})

// Seeded 5.0 without a single review isn't a rating yet — same rule as the offer list.
const stars = computed(() => {
  const value = agent.value?.stars
  return value != null && (agent.value?.stars_count ?? 0) > 0 ? Number(value).toFixed(1) : null
})

// The picked agency's otklik — its order thread is the in-app chat with them.
const pickedOffer = computed(() => {
  const agentId = claim.value?.agent_id
  if (agentId == null) return null
  return props.order.offers?.find(o => o.agent.id === agentId && o.status === 'accepted') ?? null
})

const chatOpeningId = ref<number | null>(null)

async function openChat(offer: Offer) {
  if (chatOpeningId.value !== null) return
  chatOpeningId.value = offer.id
  try {
    const chatId = offer.chat_id ?? (await openOrderChat(offer.id)).id
    await router.push(ROUTES.chatDirect(chatId))
  }
  catch (e) {
    toast.error(getApiErrorMessage(e))
  }
  finally {
    chatOpeningId.value = null
  }
}

function openProfile(profileId: number | null | undefined) {
  if (profileId) void router.push(`/agents/${profileId}`)
}
</script>

<template>
  <div
    v-if="claim && agent"
    class="tez"
  >
    <button
      type="button"
      class="tez-agent"
      :disabled="!agent.profile_id"
      @click="openProfile(agent.profile_id)"
    >
      <Avatar
        :src="agent.company_logo"
        :name="displayName"
        size="lg"
      />
      <span class="min-w-0 flex-1 text-left">
        <span class="tez-name">{{ displayName }}</span>
        <span class="tez-rating">
          <Star
            class="tez-star"
            aria-hidden="true"
          />
          {{ stars ?? '—' }}
          <template v-if="stars"> · {{ locale.t.agentHome.anketa.reviews.replace('{count}', String(agent.stars_count ?? 0)) }}</template>
          <template v-else> · {{ locale.t.agentHome.anketa.reviewsNone }}</template>
        </span>
        <span
          v-if="agent.location_label"
          class="tez-sub"
        >{{ agent.location_label }}</span>
      </span>
    </button>

    <div class="tez-actions">
      <button
        v-if="pickedOffer"
        type="button"
        class="tez-btn tez-btn--primary"
        :disabled="chatOpeningId !== null"
        @click="openChat(pickedOffer)"
      >
        <Loader2
          v-if="chatOpeningId === pickedOffer.id"
          class="size-[18px] animate-spin"
        />
        <MessageCircle
          v-else
          class="size-[18px]"
          aria-hidden="true"
        />
        {{ locale.t.route.chat }}
      </button>
      <a
        v-if="agent.phone"
        :href="`tel:${agent.phone}`"
        class="tez-btn tez-btn--soft"
      >
        <Phone
          class="size-[18px]"
          aria-hidden="true"
        />
        {{ locale.t.route.callAgent }}
      </a>
    </div>

    <a
      v-if="agent.username"
      :href="`https://t.me/${agent.username}`"
      target="_blank"
      rel="noopener"
      class="tez-link"
    >{{ locale.t.route.telegramAgent }} · @{{ agent.username }}</a>

    <p class="tez-text">
      {{ locale.t.route.directNote }}
    </p>
  </div>
</template>

<style scoped>
.tez { display: flex; flex-direction: column; gap: 14px; padding: 16px; border-radius: 22px; background: var(--card); }
.tez-text { margin: 0; font-size: 12.5px; line-height: 1.45; color: var(--muted-foreground); }
.tez-agent { display: flex; width: 100%; align-items: center; gap: 12px; padding: 0; border: 0; background: none; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.tez-agent:disabled { cursor: default; }
.tez-agent:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: 16px; }
.tez-name { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; font-weight: 600; color: var(--foreground); }
.tez-rating { display: flex; align-items: center; gap: 4px; margin-top: 3px; font-size: 12.5px; color: var(--muted-foreground); }
.tez-star { width: 13px; height: 13px; fill: var(--rb-rating); color: var(--rb-rating); }
.tez-sub { display: block; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--muted-foreground); }
.tez-actions { display: flex; gap: 10px; }
.tez-btn {
  display: inline-flex; flex: 1; min-height: 46px; align-items: center; justify-content: center; gap: 8px;
  border: 0; border-radius: 999px; font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.tez-btn--primary { background: linear-gradient(180deg, color-mix(in oklab, var(--primary) 88%, white), var(--primary)); color: var(--primary-foreground); }
.tez-btn--soft { background: color-mix(in oklab, var(--primary) 12%, transparent); color: var(--primary); }
.tez-btn:disabled { opacity: 0.6; cursor: default; }
.tez-btn:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
.tez-link { font-size: 13px; font-weight: 500; color: var(--primary); text-decoration: none; }
</style>
