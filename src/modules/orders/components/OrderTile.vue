<script setup lang="ts">
import { Calendar, Eye, Folder, MapPin, Users } from '@lucide/vue'
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import Avatar from '@/core/ui/Avatar.vue'
import { cn } from '@/core/lib/utils'
import { categoryName } from '@/core/i18n/category-name'
import { regionName } from '@/core/i18n/region-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatDateTime } from '@/core/lib/date'
import type { Category } from '@/modules/agent/types/agent'
import type { OrderRegionRef } from '@/modules/orders/types/region'

export interface OrderTileClient {
  id?: number | null
  first_name: string | null
  avatar?: string | null
}

const props = defineProps<{
  title: string
  description?: string | null
  category?: Category | null
  region?: OrderRegionRef | null
  createdAt?: string | null
  viewsCount?: number | null
  offersCount?: number | null
  /** Shown as an avatar+name button when the order belongs to someone else. */
  client?: OrderTileClient | null
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{
  open: []
  openClient: []
}>()

const locale = useLocaleStore()

const displayTitle = computed(() =>
  props.title
  || (props.category ? categoryName(props.category, locale.locale) : ''),
)

const categoryLabel = computed(() =>
  props.category ? categoryName(props.category, locale.locale) : '—',
)

const cityLabel = computed(() => {
  if (props.region) return regionName(props.region, locale.locale)
  return locale.t.orders.wizard.allUzbekistan
})

const viewsLabel = computed(() =>
  locale.t.home.liveOrdersViews.replace('{count}', String(props.viewsCount ?? 0)),
)

const offersLabel = computed(() =>
  locale.t.home.liveOrdersOffers.replace('{count}', String(props.offersCount ?? 0)),
)
</script>

<template>
  <article
    class="live-order-tile pressable cursor-pointer"
    :class="cn(props.class)"
    @click="emit('open')"
  >
    <span
      class="live-order-tile__accent"
      aria-hidden="true"
    />

    <div class="space-y-2.5">
      <div class="flex items-center gap-2">
        <button
          v-if="client"
          type="button"
          class="flex min-w-0 items-center gap-2 text-left"
          :disabled="!client.id"
          @click.stop="emit('openClient')"
        >
          <Avatar
            :src="client.avatar"
            :name="client.first_name ?? undefined"
            size="sm"
            class="!size-8 !rounded-full !shadow-none"
          />
          <span class="truncate text-[13px] font-bold text-foreground">
            {{ client.first_name }}
          </span>
        </button>

        <slot name="badge" />

        <span
          v-if="createdAt"
          class="ml-auto inline-flex shrink-0 items-center gap-1 text-[11px] font-medium tabular-nums text-muted-foreground"
        >
          <Calendar class="size-3.5 shrink-0 opacity-70" />
          {{ formatDateTime(createdAt) }}
        </span>
      </div>

      <hr class="live-order-tile__rule">
    </div>

    <div class="min-w-0 space-y-1">
      <h3 class="line-clamp-2 text-[15px] font-bold leading-snug text-foreground">
        {{ displayTitle }}
      </h3>
      <p class="live-order-tile__desc">
        {{ description || ' ' }}
      </p>
    </div>

    <div class="live-order-tile__meta">
      <div class="live-order-tile__meta-item">
        <Folder class="live-order-tile__meta-icon" />
        <span class="live-order-tile__meta-label">
          {{ locale.t.home.liveOrdersMetaCategory }}
        </span>
        <span class="live-order-tile__meta-value">
          {{ categoryLabel }}
        </span>
      </div>
      <div class="live-order-tile__meta-item">
        <MapPin class="live-order-tile__meta-icon" />
        <span class="live-order-tile__meta-label">
          {{ locale.t.home.liveOrdersMetaCity }}
        </span>
        <span class="live-order-tile__meta-value">
          {{ cityLabel }}
        </span>
      </div>
    </div>

    <div class="flex items-center justify-between gap-2">
      <span class="live-order-tile__views-btn">
        <Eye class="size-3.5 shrink-0" />
        {{ viewsLabel }}
      </span>
      <span class="live-order-tile__offer-btn">
        <Users class="size-3.5 shrink-0" />
        {{ offersLabel }}
      </span>
    </div>
  </article>
</template>
