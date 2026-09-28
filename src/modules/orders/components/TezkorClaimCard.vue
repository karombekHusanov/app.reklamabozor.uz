<script setup lang="ts">
import { Loader2, MessageCircle, Star } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useToast } from '@/core/composables/useToast'
import { getApiErrorMessage } from '@/core/api/api-error'
import { formatDateTime } from '@/core/lib/date'
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
  <GlassCard class="space-y-3.5">
    <template v-if="claim && agent">
      <p class="tez-eyebrow">
        {{ locale.t.route.claimTitle }}
      </p>

      <button
        type="button"
        class="tez-agent"
        :disabled="!agent.profile_id"
        @click="openProfile(agent.profile_id)"
      >
        <Avatar
          :src="agent.company_logo"
          :name="displayName"
          size="md"
        />
        <span class="min-w-0 flex-1 text-left">
          <span class="tez-name">{{ displayName }}</span>
          <span
            v-if="agent.location_label"
            class="tez-sub"
          >{{ agent.location_label }}</span>
          <span class="tez-sub">{{ locale.t.route.claimedAt.replace('{date}', formatDateTime(claim.claimed_at)) }}</span>
        </span>
        <span
          v-if="stars"
          class="rb-chip rb-chip--rating"
        >
          <Star
            class="size-3.5 fill-current"
            aria-hidden="true"
          />
          {{ stars }}<template v-if="agent.stars_count"> ({{ agent.stars_count }})</template>
        </span>
      </button>

      <div class="flex flex-wrap gap-2">
        <button
          v-if="pickedOffer"
          type="button"
          class="tez-action tez-action--primary"
          :disabled="chatOpeningId !== null"
          @click="openChat(pickedOffer)"
        >
          <Loader2
            v-if="chatOpeningId === pickedOffer.id"
            class="size-4 animate-spin"
          />
          <MessageCircle
            v-else
            class="size-4"
            aria-hidden="true"
          />
          {{ locale.t.route.chat }}
        </button>
        <a
          v-if="agent.phone"
          :href="`tel:${agent.phone}`"
          class="tez-action"
        >{{ locale.t.route.callAgent }} · {{ agent.phone }}</a>
        <a
          v-if="agent.username"
          :href="`https://t.me/${agent.username}`"
          target="_blank"
          rel="noopener"
          class="tez-action"
        >{{ locale.t.route.telegramAgent }} · @{{ agent.username }}</a>
      </div>

      <p class="tez-text">
        {{ locale.t.route.directNote }}
      </p>
    </template>
  </GlassCard>
</template>

<style scoped>
.tez-eyebrow { margin: 0; font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); }
.tez-text { margin: 0; font-size: 13px; line-height: 1.5; color: var(--muted-foreground); }
.tez-agent {
  display: flex;
  width: 100%;
  min-height: 56px;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--rb-r-tile);
  background: var(--card);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.tez-agent:disabled { cursor: default; }
.tez-agent:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
.tez-name { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14.5px; font-weight: 800; color: var(--foreground); }
.tez-sub { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--muted-foreground); }
.tez-action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--rb-r-field);
  background: var(--secondary);
  color: var(--foreground);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}
.tez-action { gap: 6px; }
.tez-action--primary { border-color: transparent; background: var(--primary); color: var(--primary-foreground); }
.tez-action:disabled { opacity: 0.6; cursor: default; }
.tez-action:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
</style>
