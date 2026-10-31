<script setup lang="ts">
import { AtSign, BadgeCheck, Check, ExternalLink, Globe, MapPin, Phone, Plus, X } from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { regionName } from '@/core/i18n/region-name'
import { useTelegram } from '@/core/composables/useTelegram'
import { formatPrice } from '@/modules/orders/lib/order-status'
import { PLACEMENT_ORDERING_ENABLED } from '@/modules/placements/lib/feature'
import { usePlacementSelectionStore } from '@/modules/placements/stores/placement-selection.store'
import type { Placement } from '@/modules/placements/types/placement'

/**
 * Bottom card for a tapped screen on the map: what it is, whose it is, what it
 * costs (or "price on request") and how to reach the owner. Adding it to the
 * order selection is behind {@link PLACEMENT_ORDERING_ENABLED}.
 */
const props = defineProps<{
  placement: Placement
  /** Other screens sharing the same pole (group) — shown as a note. */
  groupSize?: number
}>()

const emit = defineEmits<{ close: [] }>()

const locale = useLocaleStore()
const selection = usePlacementSelectionStore()
const { haptic, WebApp } = useTelegram()

const t = computed(() => locale.t.placements)
const isSelected = computed(() => selection.has(props.placement.id))
const kindLabel = computed(() => t.value.kind[props.placement.kind] ?? t.value.kind.other)
const district = computed(() => (props.placement.district ? regionName(props.placement.district, locale.locale) : null))
const priceLine = computed(() => (props.placement.min_day_price_som
  ? t.value.fromPerDay.replace('{price}', formatPrice(props.placement.min_day_price_som).replace(/\s*so‘m$/, ''))
  : t.value.priceOnRequest))

const orderingEnabled = PLACEMENT_ORDERING_ENABLED
const websiteUrl = computed(() => {
  const site = props.placement.owner.website
  return site ? (/^https?:\/\//i.test(site) ? site : `https://${site}`) : null
})
const hasContacts = computed(() =>
  props.placement.owner.phones.length > 0 || !!props.placement.owner.website || !!props.placement.owner.email,
)

function toggle() {
  haptic(isSelected.value ? 'light' : 'medium')
  selection.toggle(props.placement)
}

function openExternal(url: string) {
  haptic('light')
  try {
    WebApp.openLink(url)
  }
  catch {
    window.open(url, '_blank', 'noopener')
  }
}

/** tel:/mailto: must go through the browser — Telegram's openLink only takes http(s). */
function openNative(url: string) {
  haptic('light')
  window.location.href = url
}

function openInMaps() {
  haptic('light')
  const url = `https://www.google.com/maps?q=${props.placement.lat},${props.placement.lng}`
  try {
    WebApp.openLink(url)
  }
  catch {
    window.open(url, '_blank', 'noopener')
  }
}
</script>

<template>
  <div class="relative rounded-3xl bg-white p-4 shadow-2xl shadow-[#02305C]/35">
    <button
      type="button"
      class="absolute right-2.5 top-2.5 z-10 flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition active:scale-90"
      :aria-label="locale.t.common.cancel"
      @click.stop="emit('close')"
    >
      <X class="size-4" />
    </button>

    <div class="flex items-start gap-3 pr-7">
      <div
        class="flex size-[3.75rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary"
      >
        <img
          v-if="placement.photo"
          :src="placement.photo"
          alt=""
          class="size-full object-cover"
        >
        <span
          v-else
          class="rb-screen-pin__glyph rb-screen-pin__glyph--lg"
          aria-hidden="true"
        />
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-[11px] font-bold uppercase tracking-wide text-primary">
          {{ kindLabel }}<template v-if="district">
            · {{ district }}
          </template>
        </p>
        <p class="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug text-slate-900">
          {{ placement.address }}
        </p>
        <p class="mt-1 flex items-center gap-1 text-xs text-slate-600">
          <span class="truncate">{{ t.owner }}: <b class="font-semibold text-slate-800">{{ placement.owner.name }}</b></span>
          <BadgeCheck
            v-if="placement.owner.on_platform"
            class="size-3.5 shrink-0 fill-primary/15 text-primary"
            :aria-label="t.onPlatform"
          />
        </p>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3.5 py-2.5">
      <div class="min-w-0">
        <p
          class="text-sm font-bold"
          :class="placement.has_price ? 'text-slate-900' : 'text-slate-600'"
        >
          {{ priceLine }}
        </p>
        <p class="truncate text-[11.5px] text-slate-500">
          {{ placement.owner.on_platform ? t.onPlatform : t.notOnPlatform }}<template v-if="groupSize && groupSize > 1">
            · {{ t.groupNote.replace('{n}', String(groupSize)) }}
          </template>
        </p>
      </div>
      <button
        type="button"
        class="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm active:scale-95"
        :aria-label="t.openInMaps"
        @click="openInMaps"
      >
        <ExternalLink class="size-4" />
      </button>
    </div>

    <div
      v-if="placement.audience_tags.length"
      class="mt-2.5 flex flex-wrap gap-1.5"
    >
      <span
        v-for="tag in placement.audience_tags"
        :key="tag"
        class="rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary"
      >
        {{ tag }}
      </span>
    </div>

    <!-- Owner contacts — the client arranges the placement with the owner directly -->
    <div class="mt-3 rounded-2xl border border-slate-200 px-3.5 py-3">
      <p class="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {{ t.contactOwner }}
      </p>
      <div
        v-if="hasContacts"
        class="mt-2 flex flex-wrap gap-2"
      >
        <a
          v-for="phone in placement.owner.phones"
          :key="phone"
          :href="`tel:${phone.replace(/[^+\d]/g, '')}`"
          class="pc-chip pc-chip--primary"
          @click.prevent="openNative(`tel:${phone.replace(/[^+\d]/g, '')}`)"
        >
          <Phone class="size-3.5" />
          {{ phone }}
        </a>
        <a
          v-if="websiteUrl"
          :href="websiteUrl"
          class="pc-chip"
          @click.prevent="openExternal(websiteUrl)"
        >
          <Globe class="size-3.5" />
          {{ placement.owner.website }}
        </a>
        <a
          v-if="placement.owner.email"
          :href="`mailto:${placement.owner.email}`"
          class="pc-chip"
          @click.prevent="openNative(`mailto:${placement.owner.email}`)"
        >
          <AtSign class="size-3.5" />
          {{ placement.owner.email }}
        </a>
      </div>
      <p
        v-else
        class="mt-1.5 text-sm text-slate-500"
      >
        {{ t.noContacts }}
      </p>
    </div>

    <button
      v-if="orderingEnabled"
      type="button"
      class="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition active:scale-[0.98]"
      :class="isSelected ? 'bg-slate-900 text-white' : 'btn-brand'"
      @click="toggle"
    >
      <Check
        v-if="isSelected"
        class="size-5"
      />
      <Plus
        v-else
        class="size-5"
      />
      {{ isSelected ? t.selected : t.select }}
      <MapPin class="sr-only" />
    </button>
  </div>
</template>

<style scoped>
.pc-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  max-width: 100%;
  padding: 0 12px;
  border-radius: 9999px;
  background: var(--secondary);
  color: var(--foreground);
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pc-chip--primary {
  background: var(--primary);
  color: var(--primary-foreground);
}
.pc-chip:active { opacity: 0.8; }
</style>
