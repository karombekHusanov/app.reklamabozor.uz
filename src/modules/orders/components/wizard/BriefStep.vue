<script setup lang="ts">
import { X } from '@lucide/vue'
import { ref } from 'vue'
import { inject } from 'vue'
import LocationPicker from '@/core/ui/LocationPicker.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { WIZARD_KEY } from '@/modules/orders/components/wizard/context'
import DeadlinePicker from '@/modules/orders/components/wizard/DeadlinePicker.vue'
import RegionPicker from '@/modules/orders/components/wizard/RegionPicker.vue'
import { MAX_ORDER_HASHTAGS } from '@/modules/orders/types/order'

const locale = useLocaleStore()
const ctx = inject(WIZARD_KEY)!

const tagInput = ref('')

function onLocationPicked(value: { lat: number, lng: number, address: string | null }) {
  ctx.draft.lat = value.lat
  ctx.draft.lng = value.lng
  if (value.address) {
    ctx.draft.location_label = value.address
  }
  delete ctx.errors.location
}

function normalizeTag(raw: string): string | null {
  let t = raw.trim().replace(/^#+/, '').toLowerCase()
  t = t.replace(/[\s_]+/g, '-').replace(/[^\p{L}\p{N}\-]+/gu, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
  if (!t) return null
  return t.slice(0, 40)
}

function addTag(raw: string) {
  const tag = normalizeTag(raw)
  if (!tag) return
  if (ctx.draft.hashtags.includes(tag)) {
    tagInput.value = ''
    return
  }
  if (ctx.draft.hashtags.length >= MAX_ORDER_HASHTAGS) {
    ctx.errors.hashtags = locale.t.orders.wizard.errHashtagsMax
    return
  }
  ctx.draft.hashtags.push(tag)
  tagInput.value = ''
  delete ctx.errors.hashtags
}

function removeTag(tag: string) {
  ctx.draft.hashtags = ctx.draft.hashtags.filter(t => t !== tag)
  delete ctx.errors.hashtags
}

function onTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
    e.preventDefault()
    addTag(tagInput.value)
  }
  else if (e.key === 'Backspace' && tagInput.value === '' && ctx.draft.hashtags.length) {
    ctx.draft.hashtags.pop()
  }
}

function onTagBlur() {
  if (tagInput.value.trim()) addTag(tagInput.value)
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h2 class="text-lg font-bold text-foreground">
        {{ locale.t.orders.wizard.briefTitle }}
      </h2>
      <p class="text-sm text-muted-foreground">
        {{ locale.t.orders.wizard.briefSubtitle }}
      </p>
    </div>

    <!-- Project name -->
    <div class="space-y-2">
      <label
        class="text-sm font-semibold text-foreground"
        for="order-title"
      >
        {{ locale.t.orders.wizard.projectNameLabel }}
      </label>
      <input
        id="order-title"
        v-model="ctx.draft.title"
        type="text"
        class="glass-input"
        :aria-invalid="Boolean(ctx.errors.title)"
        :placeholder="locale.t.orders.wizard.projectNamePlaceholder"
        @input="delete ctx.errors.title"
      >
      <p
        v-if="ctx.errors.title"
        class="text-xs font-medium text-destructive"
      >
        {{ ctx.errors.title }}
      </p>
    </div>

    <!-- Hashtags -->
    <div class="space-y-2">
      <label
        class="text-sm font-semibold text-foreground"
        for="order-hashtags"
      >
        {{ locale.t.orders.wizard.hashtagsLabel }}
        <span class="font-normal text-muted-foreground">
          ({{ ctx.draft.hashtags.length }}/{{ MAX_ORDER_HASHTAGS }})
        </span>
      </label>
      <p class="text-xs text-muted-foreground">
        {{ locale.t.orders.wizard.hashtagsHint }}
      </p>
      <div
        class="glass-input flex min-h-12 flex-wrap items-center gap-1.5 py-2"
        :aria-invalid="Boolean(ctx.errors.hashtags)"
      >
        <span
          v-for="tag in ctx.draft.hashtags"
          :key="tag"
          class="glass-chip inline-flex items-center gap-1 text-[11px] font-semibold"
        >
          #{{ tag }}
          <button
            type="button"
            class="rounded-full p-0.5 opacity-70 transition hover:opacity-100"
            :aria-label="locale.t.orders.wizard.hashtagRemove"
            @click="removeTag(tag)"
          >
            <X class="size-3" />
          </button>
        </span>
        <input
          id="order-hashtags"
          v-model="tagInput"
          type="text"
          class="min-w-[7rem] flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          :placeholder="ctx.draft.hashtags.length ? '' : locale.t.orders.wizard.hashtagsPlaceholder"
          :disabled="ctx.draft.hashtags.length >= MAX_ORDER_HASHTAGS"
          @keydown="onTagKeydown"
          @blur="onTagBlur"
        >
      </div>
      <p
        v-if="ctx.errors.hashtags"
        class="text-xs font-medium text-destructive"
      >
        {{ ctx.errors.hashtags }}
      </p>
    </div>

    <!-- Description -->
    <div class="space-y-2">
      <label
        class="text-sm font-semibold text-foreground"
        for="order-description"
      >
        {{ locale.t.orders.wizard.descriptionLabel }}
      </label>
      <textarea
        id="order-description"
        v-model="ctx.draft.description"
        rows="4"
        class="glass-input resize-none"
        :aria-invalid="Boolean(ctx.errors.description)"
        :placeholder="locale.t.orders.wizard.descriptionPlaceholder"
        @input="delete ctx.errors.description"
      />
      <p
        v-if="ctx.errors.description"
        class="text-xs font-medium text-destructive"
      >
        {{ ctx.errors.description }}
      </p>
    </div>

    <!-- Deadline -->
    <div class="space-y-2">
      <span class="text-sm font-semibold text-foreground">
        {{ locale.t.orders.wizard.deadlineLabel }}
      </span>
      <DeadlinePicker v-model="ctx.draft.deadline_date" />
    </div>

    <!-- Region (optional; null = all Uzbekistan) -->
    <div class="space-y-2">
      <span class="text-sm font-semibold text-foreground">
        {{ locale.t.orders.wizard.regionLabel }}
        <span class="font-normal text-muted-foreground">
          {{ locale.t.orders.wizard.regionOptional }}
        </span>
      </span>
      <p class="text-xs text-muted-foreground">
        {{ locale.t.orders.wizard.regionHint }}
      </p>
      <RegionPicker
        v-model:region-id="ctx.draft.region_id"
        v-model:district-id="ctx.draft.district_id"
        :regions="ctx.regions"
      />
    </div>

    <!-- Location (map pin required) -->
    <div class="space-y-2">
      <span class="text-sm font-semibold text-foreground">
        {{ locale.t.orders.wizard.locationLabel }}
      </span>
      <p class="text-xs text-muted-foreground">
        {{ locale.t.orders.wizard.locationHint }}
      </p>
      <LocationPicker
        :lat="ctx.draft.lat"
        :lng="ctx.draft.lng"
        @change="onLocationPicked"
      />
      <input
        id="order-location-label"
        v-model="ctx.draft.location_label"
        type="text"
        class="glass-input"
        :aria-invalid="Boolean(ctx.errors.location)"
        :placeholder="locale.t.orders.wizard.locationPlaceholder"
        @input="delete ctx.errors.location"
      >
      <p
        v-if="ctx.errors.location"
        class="text-xs font-medium text-destructive"
      >
        {{ ctx.errors.location }}
      </p>
    </div>
  </div>
</template>
