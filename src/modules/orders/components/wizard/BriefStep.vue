<script setup lang="ts">
import { Check, X } from '@lucide/vue'
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue'
import LocationPicker from '@/core/ui/LocationPicker.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { fetchHashtagSuggest, type HashtagSuggest } from '@/modules/home/services/live-orders.service'
import { WIZARD_KEY } from '@/modules/orders/components/wizard/context'
import DeadlinePicker from '@/modules/orders/components/wizard/DeadlinePicker.vue'
import RegionPicker from '@/modules/orders/components/wizard/RegionPicker.vue'
import { MAX_ORDER_HASHTAGS } from '@/modules/orders/types/order'

const locale = useLocaleStore()
const ctx = inject(WIZARD_KEY)!

const tagInput = ref('')
const tagInputEl = ref<HTMLInputElement | null>(null)
const tagFocused = ref(false)
const suggestions = ref<HashtagSuggest[]>([])

const canAddTags = computed(() =>
  tagInput.value.trim().length > 0 && ctx.draft.hashtags.length < MAX_ORDER_HASHTAGS,
)

const suggestQuery = computed(() => {
  const parts = tagInput.value.split(/[,;#\n]+|\s+/)
  return (parts[parts.length - 1] ?? '').replace(/^#+/, '').trim()
})

const visibleSuggestions = computed(() =>
  suggestions.value.filter(item => !ctx.draft.hashtags.includes(item.slug)),
)

const showSuggestions = computed(() =>
  tagFocused.value
  && ctx.draft.hashtags.length < MAX_ORDER_HASHTAGS
  && visibleSuggestions.value.length > 0,
)

let suggestTimer: ReturnType<typeof setTimeout> | null = null

async function loadSuggestions(q: string) {
  try {
    suggestions.value = await fetchHashtagSuggest(q, 8)
  }
  catch {
    suggestions.value = []
  }
}

function scheduleSuggest() {
  if (suggestTimer) clearTimeout(suggestTimer)
  suggestTimer = setTimeout(() => {
    void loadSuggestions(suggestQuery.value)
  }, 180)
}

watch(tagInput, () => {
  if (tagFocused.value) scheduleSuggest()
})

onBeforeUnmount(() => {
  if (suggestTimer) clearTimeout(suggestTimer)
})

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

function parseTags(raw: string): string[] {
  const seen = new Set<string>()
  const tags: string[] = []
  for (const part of raw.split(/[,;#\n]+|\s+/)) {
    const tag = normalizeTag(part)
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    tags.push(tag)
  }
  return tags
}

function commitTags() {
  const tokens = parseTags(tagInput.value)
  if (!tokens.length) {
    if (!tagInput.value.trim()) tagInput.value = ''
    return
  }

  for (const tag of tokens) {
    if (ctx.draft.hashtags.includes(tag)) continue
    if (ctx.draft.hashtags.length >= MAX_ORDER_HASHTAGS) {
      ctx.errors.hashtags = locale.t.orders.wizard.errHashtagsMax
      tagInput.value = ''
      return
    }
    ctx.draft.hashtags.push(tag)
  }

  tagInput.value = ''
  delete ctx.errors.hashtags
}

function removeTag(tag: string) {
  ctx.draft.hashtags = ctx.draft.hashtags.filter(t => t !== tag)
  delete ctx.errors.hashtags
}

function onTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    commitTags()
    scheduleSuggest()
  }
  else if (e.key === 'Backspace' && tagInput.value === '' && ctx.draft.hashtags.length) {
    ctx.draft.hashtags.pop()
  }
}

function onTagFocus() {
  tagFocused.value = true
  void loadSuggestions(suggestQuery.value)
}

function onTagBlur() {
  tagFocused.value = false
  commitTags()
}

function pickSuggestion(item: HashtagSuggest) {
  tagInput.value = item.slug
  commitTags()
  void loadSuggestions('')
  tagInputEl.value?.focus()
}

function focusTagInput() {
  tagInputEl.value?.focus()
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h2 class="rb-font-display text-lg font-extrabold tracking-[-0.015em] text-foreground">
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
      <div class="relative">
        <div
          class="flex min-h-10 overflow-hidden rounded-xl border bg-background focus-within:ring-2 dark:bg-white/[0.06]"
          :class="ctx.errors.hashtags
            ? 'border-destructive focus-within:border-destructive focus-within:ring-destructive/25'
            : 'border-input focus-within:border-primary focus-within:ring-primary/25 dark:border-white/18'"
          @click="focusTagInput"
        >
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 px-2 py-1.5">
            <span
              v-for="tag in ctx.draft.hashtags"
              :key="tag"
              class="order-hashtag order-hashtag--picked gap-1 pr-1"
            >
              #{{ tag }}
              <button
                type="button"
                class="rounded-full p-0.5 text-primary/70 transition hover:bg-primary/15 hover:text-primary"
                :aria-label="locale.t.orders.wizard.hashtagRemove"
                @click.stop="removeTag(tag)"
              >
                <X class="size-3.5" />
              </button>
            </span>
            <input
              id="order-hashtags"
              ref="tagInputEl"
              v-model="tagInput"
              type="text"
              class="min-w-[5.5rem] flex-1 bg-transparent py-0.5 text-[16px] leading-6 outline-none placeholder:text-muted-foreground"
              :placeholder="ctx.draft.hashtags.length ? '' : locale.t.orders.wizard.hashtagsPlaceholder"
              :disabled="ctx.draft.hashtags.length >= MAX_ORDER_HASHTAGS"
              enterkeyhint="done"
              autocomplete="off"
              @focus="onTagFocus"
              @keydown="onTagKeydown"
              @blur="onTagBlur"
            >
          </div>
          <button
            type="button"
            class="flex w-10 shrink-0 items-center justify-center self-stretch bg-primary text-primary-foreground transition disabled:opacity-40"
            :aria-label="locale.t.orders.wizard.hashtagAdd"
            :disabled="!canAddTags"
            @pointerdown.prevent
            @click="commitTags"
          >
            <Check class="size-4" />
          </button>
        </div>
        <div
          v-if="showSuggestions"
          class="absolute inset-x-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg dark:border-white/10"
        >
          <button
            v-for="item in visibleSuggestions"
            :key="item.id"
            type="button"
            class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-muted/70"
            @pointerdown.prevent
            @click="pickSuggestion(item)"
          >
            <span class="truncate font-medium">#{{ item.label || item.slug }}</span>
            <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {{ item.usage_count }}
            </span>
          </button>
        </div>
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
