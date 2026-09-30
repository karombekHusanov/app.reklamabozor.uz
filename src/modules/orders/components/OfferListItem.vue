<script setup lang="ts">
import { MessageCircle, Star } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatDate } from '@/core/lib/date'
import { formatPrice, isInterestOffer } from '@/modules/orders/lib/order-status'
import type { Offer } from '@/modules/orders/types/order'

/**
 * One offer on the client's order page (Profi-style row): photo, name,
 * rating + review count, a one-line preview of the order thread and its
 * time. Tapping it opens the chat with that agency.
 */
const props = defineProps<{
  offer: Offer
}>()

const emit = defineEmits<{ open: [offer: Offer] }>()

const locale = useLocaleStore()

const name = computed(() => props.offer.agent.company_name || '—')
const photo = computed(() => props.offer.agent.company_logo || props.offer.agent.avatar || null)
const photoFailed = ref(false)
watch(photo, () => { photoFailed.value = false })

const initials = computed(() =>
  name.value.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase(),
)

const starsCount = computed(() => props.offer.agent.stars_count ?? 0)
const stars = computed(() => {
  const s = props.offer.agent.stars
  return starsCount.value > 0 && s != null ? Number(s).toFixed(1) : null
})

const lastMessage = computed(() => props.offer.chat?.last_message ?? null)
const unread = computed(() => props.offer.chat?.unread_count ?? 0)

// Latest text in the thread; else what the offer itself says.
const snippet = computed(() => {
  const t = locale.t.orderView
  const msg = lastMessage.value
  if (msg && msg.body && (!msg.type || msg.type === 'text')) {
    return (msg.mine ? t.snippetYou : '') + msg.body
  }
  if (props.offer.comment) return props.offer.comment
  if (!isInterestOffer(props.offer)) return t.snippetPrice.replace('{price}', formatPrice(props.offer.price))
  return t.snippetInterest
})

const timeLabel = computed(() => {
  const at = lastMessage.value?.created_at ?? props.offer.created_at
  const d = dayjs(at)
  if (!d.isValid()) return ''
  return d.isSame(dayjs(), 'day') ? d.format('HH:mm') : formatDate(at)
})

const statusChip = computed(() => {
  const t = locale.t.orderView
  switch (props.offer.status) {
    case 'accepted': return { label: t.statusPicked, tone: 'ok' }
    case 'rejected': return { label: t.statusRejected, tone: 'muted' }
    case 'withdrawn': return { label: t.statusWithdrawn, tone: 'muted' }
    default: return null
  }
})
</script>

<template>
  <button
    type="button"
    class="oli"
    :class="{ 'oli--dim': statusChip?.tone === 'muted' }"
    @click="emit('open', offer)"
  >
    <span class="oli__photo">
      <img
        v-if="photo && !photoFailed"
        :src="photo"
        :alt="name"
        loading="lazy"
        @error="photoFailed = true"
      >
      <span
        v-else
        class="oli__initials"
      >{{ initials }}</span>
    </span>

    <span class="oli__body">
      <span class="oli__top">
        <span class="oli__name">{{ name }}</span>
        <span class="oli__time">{{ timeLabel }}</span>
      </span>

      <span class="oli__chips">
        <template v-if="stars">
          <Star
            class="oli__star"
            aria-hidden="true"
          />
          {{ stars }} · {{ locale.t.agentHome.anketa.reviews.replace('{count}', String(starsCount)) }}
        </template>
        <template v-else>
          <MessageCircle
            class="size-3"
            aria-hidden="true"
          />
          {{ locale.t.agentHome.anketa.reviewsNone }}
        </template>
        <span
          v-if="statusChip"
          class="oli__chip oli__chip--tag"
          :class="statusChip.tone === 'ok' ? 'oli__chip--ok' : ''"
        >{{ statusChip.label }}</span>
      </span>

      <span class="oli__bottom">
        <span
          class="oli__snippet"
          :class="{ 'oli__snippet--unread': unread > 0 }"
        >{{ snippet }}</span>
        <span
          v-if="unread > 0"
          class="oli__badge"
        >{{ unread }}</span>
      </span>
    </span>
  </button>
</template>

<style scoped>
.oli {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform var(--rb-dur) var(--rb-ease);
}
.oli:active { transform: scale(0.99); }
.oli:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: var(--rb-r-tile); }
.oli--dim { opacity: 0.6; }

.oli__photo {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 44px;
  height: 44px;
  overflow: hidden;
  border-radius: 14px;
  background: var(--secondary);
}
.oli__photo img { width: 100%; height: 100%; object-fit: cover; }
.oli__initials { font-size: 14px; font-weight: 600; color: var(--muted-foreground); }

.oli__body { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3px; }
.oli__top { display: flex; align-items: baseline; gap: 8px; }
.oli__name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--foreground);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.oli__time { flex-shrink: 0; font-size: 11.5px; color: var(--muted-foreground); font-variant-numeric: tabular-nums; }

.oli__chips { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 12px; color: var(--muted-foreground); }
.oli__chip--tag { margin-left: 6px; }
.oli__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: auto;
  padding: 0;
  background: none;
  color: var(--muted-foreground);
  font-size: 12px;
  font-weight: 400;
}
.oli__chip--ok { color: var(--success); font-weight: 600; }
.oli__star { width: 12px; height: 12px; fill: var(--rb-rating); color: var(--rb-rating); }

.oli__bottom { display: flex; align-items: center; gap: 8px; }
.oli__snippet {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  font-size: 13px;
  color: var(--muted-foreground);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.oli__snippet--unread { color: var(--foreground); font-weight: 500; }
.oli__badge {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 11px;
  font-weight: 600;
}
</style>
