<script setup lang="ts">
import { Eye, MessageSquareQuote } from '@lucide/vue'
import Avatar from '@/core/ui/Avatar.vue'
import { formatDateTime } from '@/core/lib/date'
import { useLocaleStore } from '@/core/i18n/locale.store'
import OrderHashtagChips from '@/modules/orders/components/OrderHashtagChips.vue'
import type { OrderHashtag } from '@/modules/orders/types/order'

export interface OrderPreviewClient {
  id?: number | null
  first_name: string | null
  avatar?: string | null
}

defineProps<{
  id?: string
  highlight?: boolean
  client?: OrderPreviewClient | null
  createdAt?: string | null
  orderId?: number | null
  categoryLabel?: string | null
  title: string
  description?: string | null
  hashtags?: OrderHashtag[] | null
  viewsCount?: number | null
  offersCount?: number | null
}>()

const emit = defineEmits<{
  open: []
  openClient: []
}>()

const locale = useLocaleStore()

function onClientClick(e: Event) {
  e.stopPropagation()
  emit('openClient')
}
</script>

<template>
  <article
    :id="id"
    class="live-order-card pressable cursor-pointer scroll-mt-20"
    :class="highlight && 'ring-2 ring-primary/50'"
    @click="emit('open')"
  >
    <div
      v-if="client"
      class="flex items-center gap-2"
    >
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2 text-left"
        :disabled="!client.id"
        @click="onClientClick"
      >
        <Avatar
          :src="client.avatar"
          :name="client.first_name ?? undefined"
          size="sm"
          class="rounded-full"
        />
        <span class="truncate text-xs font-semibold text-foreground">
          {{ client.first_name }}
        </span>
      </button>
      <slot name="aside">
        <span
          v-if="createdAt"
          class="live-order-card__date"
        >
          {{ formatDateTime(createdAt) }}
        </span>
      </slot>
    </div>

    <div class="flex min-w-0 items-center gap-1.5">
      <span
        v-if="categoryLabel"
        class="live-order-card__chip min-w-0"
      >
        {{ categoryLabel }}
      </span>
      <span
        v-else-if="client"
        class="live-order-card__chip invisible"
      >
        {{ '\u00a0' }}
      </span>
      <slot name="chips" />
      <span
        v-if="!client && (orderId || createdAt)"
        class="ml-auto flex shrink-0 items-center gap-1"
      >
        <span
          v-if="orderId"
          class="live-order-card__date !ml-0"
        >
          #{{ orderId }}
        </span>
        <span
          v-if="createdAt"
          class="live-order-card__date !ml-0"
        >
          {{ formatDateTime(createdAt) }}
        </span>
      </span>
    </div>

    <h3 class="live-order-card__title">
      {{ title }}
    </h3>

    <p class="live-order-card__desc">
      {{ description || '\u00a0' }}
    </p>

    <div class="live-order-card__tags">
      <OrderHashtagChips
        compact
        :hashtags="hashtags"
      />
    </div>

    <div class="live-order-card__meta">
      <slot name="meta">
        <span class="live-order-card__stat">
          <Eye class="size-3.5 shrink-0 opacity-80" />
          <span class="tabular-nums">{{ viewsCount ?? 0 }}</span>
          <span class="font-semibold text-muted-foreground">{{ locale.t.orders.viewsSuffix }}</span>
        </span>
        <span class="live-order-card__stat live-order-card__stat--offers">
          <MessageSquareQuote class="size-3.5 shrink-0" />
          <span class="tabular-nums">{{ offersCount ?? 0 }}</span>
          <span class="font-semibold opacity-90">{{ locale.t.orders.offersSuffix }}</span>
        </span>
      </slot>
    </div>
  </article>
</template>
