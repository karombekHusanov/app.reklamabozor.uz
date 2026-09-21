<script setup lang="ts">
import { Loader2, Star } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatDateTime } from '@/core/lib/date'
import type { Order } from '@/modules/orders/types/order'

const props = defineProps<{
  order: Order
  busy: boolean
}>()

const emit = defineEmits<{
  close: []
  release: []
}>()

const locale = useLocaleStore()
const router = useRouter()

const claim = computed(() => props.order.claim ?? null)
const agent = computed(() => claim.value?.agent ?? null)

const displayName = computed(() => {
  const a = agent.value
  if (!a) return ''
  return a.company_name || [a.first_name, a.last_name].filter(Boolean).join(' ')
})

const stars = computed(() => {
  const value = agent.value?.stars
  return value != null ? Number(value).toFixed(1) : null
})

function openProfile() {
  const id = agent.value?.profile_id
  if (id) void router.push(`/agents/${id}`)
}
</script>

<template>
  <GlassCard class="space-y-3.5">
    <!-- Waiting for the first agent -->
    <template v-if="!claim || !agent">
      <p class="tez-title">
        {{ locale.t.route.claimWaitingTitle }}
      </p>
      <p class="tez-text">
        {{ locale.t.route.claimWaitingBody }}
      </p>
    </template>

    <!-- Claimed agent -->
    <template v-else>
      <p class="tez-eyebrow">
        {{ locale.t.route.claimTitle }}
      </p>

      <button
        type="button"
        class="tez-agent"
        :disabled="!agent.profile_id"
        @click="openProfile"
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
        <button
          v-if="agent.profile_id"
          type="button"
          class="tez-action"
          @click="openProfile"
        >
          {{ locale.t.route.viewProfile }}
        </button>
      </div>

      <p class="tez-text">
        {{ locale.t.route.directNote }}
      </p>

      <div
        v-if="order.can_close || order.can_release"
        class="space-y-2"
      >
        <Button
          v-if="order.can_close"
          class="h-12 w-full rounded-2xl text-base"
          :disabled="busy"
          @click="emit('close')"
        >
          <Loader2
            v-if="busy"
            class="size-4 animate-spin"
          />
          {{ locale.t.route.close }}
        </Button>
        <Button
          v-if="order.can_release"
          variant="outline"
          class="h-11 w-full rounded-2xl"
          :disabled="busy"
          @click="emit('release')"
        >
          {{ locale.t.route.release }}
        </Button>
      </div>
    </template>
  </GlassCard>
</template>

<style scoped>
.tez-eyebrow { margin: 0; font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); }
.tez-title { margin: 0; font-family: var(--rb-font-display); font-size: 16px; font-weight: 800; color: var(--foreground); }
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
.tez-action:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
</style>
