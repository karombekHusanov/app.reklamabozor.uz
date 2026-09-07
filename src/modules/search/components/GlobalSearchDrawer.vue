<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowRight, Loader2, Search, SearchX, Star, X } from '@lucide/vue'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/core/ui/drawer'
import Avatar from '@/core/ui/Avatar.vue'
import { categoryIcon } from '@/modules/orders/lib/category-icon'
import { categoryName } from '@/core/i18n/category-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import {
  SEARCH_MIN_CHARS,
  searchMarketplace,
  type MarketplaceSearchResults,
} from '@/modules/search/services/search.service'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'
import type { Category } from '@/modules/agent/types/agent'

const props = defineProps<{
  /** Full category list — services are matched locally against it. */
  categories: Category[]
}>()

const emit = defineEmits<{
  provider: [agent: PublicAgent]
  service: [category: Category]
  /** Full marketplace results for the current query. */
  viewAll: [query: string]
}>()

const open = defineModel<boolean>('open', { default: false })

const locale = useLocaleStore()
const { haptic } = useTelegram()

const DEBOUNCE_MS = 300

const query = ref('')
const loading = ref(false)
const failed = ref(false)
const results = ref<MarketplaceSearchResults>({ agencies: [], designers: [], services: [] })
const inputRef = ref<HTMLInputElement | null>(null)

let timer: ReturnType<typeof setTimeout> | null = null
/** Guards against a slow early response overwriting a newer one. */
let requestSeq = 0

const trimmed = computed(() => query.value.trim())
const isTooShort = computed(() => trimmed.value.length < SEARCH_MIN_CHARS)
const total = computed(() =>
  results.value.agencies.length + results.value.designers.length + results.value.services.length,
)
const isEmpty = computed(() => !loading.value && !failed.value && !isTooShort.value && total.value === 0)

function reset() {
  results.value = { agencies: [], designers: [], services: [] }
  loading.value = false
  failed.value = false
}

async function run(term: string) {
  const seq = ++requestSeq
  loading.value = true
  failed.value = false

  try {
    const found = await searchMarketplace(term, props.categories)
    if (seq !== requestSeq) return
    results.value = found
  }
  catch {
    if (seq !== requestSeq) return
    failed.value = true
    results.value = { agencies: [], designers: [], services: [] }
  }
  finally {
    if (seq === requestSeq) loading.value = false
  }
}

watch(query, () => {
  if (timer) clearTimeout(timer)

  if (isTooShort.value) {
    // Drop any in-flight response so a stale result can't land on an empty box.
    requestSeq += 1
    reset()
    return
  }

  timer = setTimeout(() => void run(trimmed.value), DEBOUNCE_MS)
})

watch(open, async (isOpen) => {
  if (!isOpen) {
    if (timer) clearTimeout(timer)
    requestSeq += 1
    query.value = ''
    reset()
    return
  }

  await nextTick()
  inputRef.value?.focus()
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

function clear() {
  query.value = ''
  inputRef.value?.focus()
}

function pickProvider(agent: PublicAgent) {
  haptic('light')
  open.value = false
  emit('provider', agent)
}

function viewAll() {
  if (isTooShort.value) return
  haptic('light')
  open.value = false
  emit('viewAll', trimmed.value)
}

function pickService(category: Category) {
  haptic('light')
  open.value = false
  emit('service', category)
}

function providerMeta(agent: PublicAgent): string {
  const chips = agent.categories.slice(0, 2).map(category => categoryName(category, locale.locale))
  const parts = [agent.location_label, ...chips].filter(Boolean) as string[]

  return parts.join(' · ')
}

function providerStars(agent: PublicAgent): string | null {
  const stars = agent.stars ?? agent.rating_avg
  return stars === null ? null : stars.toFixed(1)
}
</script>

<template>
  <Drawer v-model:open="open">
    <DrawerContent
      class="z-[100] h-[88vh] rounded-t-[28px] border-border/60 bg-card dark:bg-[#0c1f36]"
    >
      <DrawerHeader class="gap-3 px-4 pb-2 pt-3">
        <DrawerTitle class="rb-font-display text-[17px] font-extrabold tracking-[-0.01em]">
          {{ locale.t.search.title }}
        </DrawerTitle>

        <div class="glass-input flex h-12 items-center gap-2.5 !py-0">
          <Search class="size-[18px] shrink-0 text-muted-foreground" />
          <input
            ref="inputRef"
            v-model="query"
            type="search"
            enterkeyhint="search"
            autocomplete="off"
            :placeholder="locale.t.search.placeholder"
            :aria-label="locale.t.search.placeholder"
            class="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            @keydown.enter.prevent="viewAll"
          >
          <Loader2
            v-if="loading"
            class="size-4 shrink-0 animate-spin text-muted-foreground"
          />
          <button
            v-else-if="query"
            type="button"
            class="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition active:scale-90"
            :aria-label="locale.t.search.clear"
            @click="clear"
          >
            <X class="size-4" />
          </button>
        </div>
      </DrawerHeader>

      <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <p
          v-if="isTooShort"
          class="px-1 py-8 text-center text-[13px] text-muted-foreground"
        >
          {{ locale.t.search.hint }}
        </p>

        <p
          v-else-if="failed"
          class="px-1 py-8 text-center text-[13px] text-destructive"
        >
          {{ locale.t.search.error }}
        </p>

        <div
          v-else-if="isEmpty"
          class="flex flex-col items-center gap-2 px-1 py-10 text-center"
        >
          <SearchX class="size-7 text-muted-foreground" />
          <p class="rb-font-display text-[15px] font-extrabold text-foreground">
            {{ locale.t.search.empty }}
          </p>
          <p class="text-[12.5px] text-muted-foreground">
            {{ locale.t.search.emptyHint }}
          </p>
        </div>

        <template v-else>
          <!-- Agencies -->
          <section v-if="results.agencies.length">
            <h3 class="search-sec">
              {{ locale.t.search.agencies }}
              <span class="search-sec__n">{{ results.agencies.length }}</span>
            </h3>
            <button
              v-for="agent in results.agencies"
              :key="`a-${agent.id}`"
              type="button"
              class="search-row"
              @click="pickProvider(agent)"
            >
              <Avatar
                :src="agent.company_logo ?? agent.avatar"
                :name="agent.display_name"
                class="size-11 shrink-0 rounded-2xl"
              />
              <span class="search-row__body">
                <span class="search-row__name">{{ agent.display_name }}</span>
                <span class="search-row__meta">{{ providerMeta(agent) }}</span>
              </span>
              <span
                v-if="providerStars(agent)"
                class="search-row__star"
              >
                <Star class="size-3.5 fill-current" />
                {{ providerStars(agent) }}
              </span>
            </button>
          </section>

          <!-- Designers -->
          <section v-if="results.designers.length">
            <h3 class="search-sec">
              {{ locale.t.search.designers }}
              <span class="search-sec__n">{{ results.designers.length }}</span>
            </h3>
            <button
              v-for="agent in results.designers"
              :key="`d-${agent.id}`"
              type="button"
              class="search-row"
              @click="pickProvider(agent)"
            >
              <Avatar
                :src="agent.avatar ?? agent.company_logo"
                :name="agent.display_name"
                class="size-11 shrink-0 rounded-full"
              />
              <span class="search-row__body">
                <span class="search-row__name">{{ agent.display_name }}</span>
                <span class="search-row__meta">{{ providerMeta(agent) }}</span>
              </span>
              <span
                v-if="providerStars(agent)"
                class="search-row__star"
              >
                <Star class="size-3.5 fill-current" />
                {{ providerStars(agent) }}
              </span>
            </button>
          </section>

          <!-- Full results for the query -->
          <button
            type="button"
            class="search-all"
            @click="viewAll"
          >
            <span>{{ locale.t.search.viewAll }}</span>
            <ArrowRight class="size-4" />
          </button>

          <!-- Services (categories) -->
          <section v-if="results.services.length">
            <h3 class="search-sec">
              {{ locale.t.search.services }}
              <span class="search-sec__n">{{ results.services.length }}</span>
            </h3>
            <button
              v-for="category in results.services"
              :key="`s-${category.id}`"
              type="button"
              class="search-row"
              @click="pickService(category)"
            >
              <span class="search-row__tile">
                <component
                  :is="categoryIcon(category)"
                  class="size-[19px]"
                />
              </span>
              <span class="search-row__body">
                <span class="search-row__name">{{ categoryName(category, locale.locale) }}</span>
                <span class="search-row__meta">
                  {{ category.type === 'designer' ? locale.t.search.designers : locale.t.search.agencies }}
                </span>
              </span>
            </button>
          </section>
        </template>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<style scoped>
/* the field ships its own clear button — drop WebKit's native duplicate */
input[type='search']::-webkit-search-cancel-button,
input[type='search']::-webkit-search-decoration {
  -webkit-appearance: none;
  appearance: none;
}

.search-sec {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 14px 4px 6px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}
.search-sec__n {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--rb-r-chip);
  background: var(--secondary);
  color: var(--secondary-foreground);
  font-size: 10px;
  letter-spacing: 0;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 60px;
  padding: 9px 10px;
  border: 0;
  border-radius: var(--rb-r-tile);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background var(--rb-dur) var(--rb-ease), transform var(--rb-dur) var(--rb-ease);
}
.search-row:active {
  background: color-mix(in oklab, var(--primary) 8%, transparent);
  transform: scale(0.99);
}
.search-row:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }

.search-row__tile {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: var(--rb-r-icon);
  background: var(--secondary);
  color: var(--primary);
}

.search-row__body { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
.search-row__name {
  font-family: var(--rb-font-display);
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-row__meta {
  font-size: 12px;
  color: var(--muted-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-all {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  min-height: 46px;
  margin-top: 10px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--rb-r-field);
  background: var(--secondary);
  color: var(--primary);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  transition: transform var(--rb-dur) var(--rb-ease);
}
.search-all:active { transform: scale(0.98); }
.search-all:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

.search-row__star {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  font-size: 12.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--rb-rating);
}
</style>
