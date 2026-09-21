<script setup lang="ts">
import { Check, ChevronRight, CloudUpload, FileText, ImageIcon, Loader2, MapPin, Search, Send, X } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import Drawer from '@/core/ui/Drawer.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import LocationPicker from '@/core/ui/LocationPicker.vue'
import StickyActionBar from '@/core/ui/StickyActionBar.vue'
import { useFileUpload } from '@/core/composables/useFileUpload'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import CategoryThumb from '@/modules/orders/components/CategoryThumb.vue'
import { categoryName } from '@/core/i18n/category-name'
import { regionName } from '@/core/i18n/region-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatFileSize, isImageFile } from '@/modules/orders/lib/wizard'
import { useOrderDraftStore } from '@/modules/orders/stores/order-draft.store'
import type { Category } from '@/modules/agent/types/agent'
import type { CreateOrderPayload, OrderRoute } from '@/modules/orders/types/order'
import type { Region } from '@/modules/orders/types/region'

const props = defineProps<{
  categories: Category[]
  regions: Region[]
  submitting: boolean
  /** Directed order — the request reaches only this agency. */
  targetAgent: { id: number, company_name: string } | null
  /** Tender | Tezkor — fixed by the tab the request is created from. */
  route: OrderRoute
}>()

const emit = defineEmits<{
  submit: [payload: CreateOrderPayload]
}>()

const MAX_FILES = 5

// MVP: the category is inferred by the backend, the city is fixed to Tashkent
// and the map pin is skipped. The pickers stay in the code (they may return).
const SHOW_CATEGORY_PICKER = false
const SHOW_REGION_PICKER = false
const SHOW_LOCATION_PICKER = false
const TASHKENT_REGION_CODE = 'toshkent-shahri'

const locale = useLocaleStore()
const { haptic } = useTelegram()
const { isUploading, upload } = useFileUpload()
const orderDraft = useOrderDraftStore()
const toast = useToast()

interface DraftFile { id: number, url: string, name: string, mime: string | null, size: number }

const categoryId = ref<number | null>(null)
const description = ref('')
const files = ref<DraftFile[]>([])
const regionId = ref<number | null>(null)
const location = ref<{ lat: number, lng: number, label: string | null } | null>(null)

const descriptionError = ref<string | null>(null)
const categoryOpen = ref(false)
const regionOpen = ref(false)
const mapOpen = ref(false)
const categoryQuery = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const descriptionRef = ref<HTMLTextAreaElement | null>(null)

const selectedCategory = computed(() =>
  props.categories.find(category => category.id === categoryId.value) ?? null,
)

/** Fixed city: the Tashkent region row, when the catalog has it. */
const tashkentRegion = computed(() =>
  props.regions.find(region => region.code === TASHKENT_REGION_CODE) ?? null,
)

const effectiveRegionId = computed(() =>
  SHOW_REGION_PICKER ? regionId.value : (tashkentRegion.value?.id ?? null),
)

const selectedRegion = computed(() =>
  props.regions.find(region => region.id === regionId.value) ?? null,
)

const filteredCategories = computed(() => {
  const query = categoryQuery.value.trim().toLowerCase()
  if (!query) return props.categories

  return props.categories.filter(category =>
    category.name_uz.toLowerCase().includes(query)
    || category.name_ru.toLowerCase().includes(query),
  )
})

// A draft handed over by the AI assistant pre-fills the form once; the client
// still reviews and sends it themselves.
onMounted(() => {
  const draft = orderDraft.consume()
  if (!draft) return

  description.value = draft.description
  if (draft.category_id !== null && props.categories.some(category => category.id === draft.category_id)) {
    categoryId.value = draft.category_id
  }
})

function pickCategory(id: number | null) {
  haptic('light')
  categoryId.value = id
  categoryOpen.value = false
}

function pickRegion(id: number | null) {
  haptic('light')
  regionId.value = id
  regionOpen.value = false
}

function pickFile() {
  if (isUploading.value || files.value.length >= MAX_FILES) return
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const picked = Array.from(target.files ?? [])
  target.value = ''

  for (const file of picked) {
    if (files.value.length >= MAX_FILES) break

    const uploaded = await upload(file)
    if (uploaded) {
      files.value.push({
        id: uploaded.id,
        url: uploaded.url,
        name: uploaded.original_name,
        mime: uploaded.mime_type,
        size: uploaded.size,
      })
    }
  }
}

function removeFile(index: number) {
  haptic('light')
  files.value.splice(index, 1)
}

function onLocationChange(value: { lat: number, lng: number, address: string | null }) {
  location.value = { lat: value.lat, lng: value.lng, label: value.address }
}

function clearLocation() {
  haptic('light')
  location.value = null
  mapOpen.value = false
}

/**
 * Bring the description into view and put the cursor in it. Smooth scrolling is
 * skipped under reduced-motion, and a short backstop jumps the field into view
 * if the smooth scroll never ran (older WebViews, backgrounded tabs).
 */
function focusDescription() {
  const field = descriptionRef.value
  if (!field) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  field.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
  field.focus({ preventScroll: true })

  window.setTimeout(() => {
    const box = field.getBoundingClientRect()
    if (box.top < 0 || box.bottom > window.innerHeight) {
      field.scrollIntoView({ block: 'center' })
    }
  }, 400)
}

function submit() {
  const text = description.value.trim()

  if (text.length < 10) {
    // Say what is wrong three ways: a toast, the field's own message, and by
    // bringing the field into view with the cursor already in it.
    descriptionError.value = locale.t.orders.form.errDescription
    toast.error(locale.t.orders.form.errDescription)
    haptic('heavy')

    focusDescription()
    return
  }

  descriptionError.value = null

  emit('submit', {
    ...(categoryId.value !== null ? { category_id: categoryId.value } : {}),
    description: text,
    route: props.route,
    attachment_file_ids: files.value.map(file => file.id),
    ...(effectiveRegionId.value !== null ? { region_id: effectiveRegionId.value } : {}),
    ...(SHOW_LOCATION_PICKER && location.value
      ? {
          lat: location.value.lat,
          lng: location.value.lng,
          location_label: location.value.label,
        }
      : {}),
    ...(props.targetAgent ? { agent_profile_id: props.targetAgent.id } : {}),
  })
}
</script>

<template>
  <div class="space-y-3.5">
    <!-- Which route this request takes (fixed by the tab it was created from) -->
    <p class="route-hint">
      {{ props.route === 'tender' ? locale.t.route.formTender : locale.t.route.formTezkor }}
    </p>

    <!-- Directed order banner -->
    <GlassCard
      v-if="targetAgent"
      class="flex items-center gap-2 py-3 text-[13px]"
    >
      <span class="text-muted-foreground">{{ locale.t.orders.wizard.directedTo }}</span>
      <span class="font-semibold text-foreground">{{ targetAgent.company_name }}</span>
    </GlassCard>

    <!-- 1 · Service type (optional) — hidden, the backend infers it -->
    <GlassCard
      v-if="SHOW_CATEGORY_PICKER"
      class="space-y-2.5"
    >
      <p class="field-label">
        {{ locale.t.orders.form.categoryLabel }}
        <span class="field-optional">{{ locale.t.orders.form.optional }}</span>
      </p>

      <button
        type="button"
        class="picker"
        @click="haptic('light'); categoryOpen = true"
      >
        <span
          v-if="selectedCategory"
          class="picker__icon"
        >
          <CategoryThumb :category="selectedCategory" :size="18" />
        </span>
        <span
          class="picker__value"
          :class="selectedCategory ? '' : 'picker__value--empty'"
        >
          {{ selectedCategory ? categoryName(selectedCategory, locale.locale) : locale.t.orders.form.categoryPlaceholder }}
        </span>
        <ChevronRight class="size-[18px] shrink-0 text-muted-foreground" />
      </button>
    </GlassCard>

    <!-- 2 · What do you need (required) -->
    <GlassCard class="space-y-2.5">
      <label
        class="field-label"
        for="order-description"
      >{{ locale.t.orders.form.descriptionLabel }}</label>

      <textarea
        id="order-description"
        ref="descriptionRef"
        v-model="description"
        rows="5"
        class="glass-input min-h-[132px] w-full resize-none text-base leading-relaxed"
        :placeholder="locale.t.orders.form.descriptionPlaceholder"
        @input="descriptionError = null"
      />

      <p
        v-if="descriptionError"
        class="text-[12.5px] font-medium text-destructive"
      >
        {{ descriptionError }}
      </p>
    </GlassCard>

    <!-- 3 · Files (optional, multiple) -->
    <GlassCard class="space-y-2.5">
      <p class="field-label">
        {{ locale.t.orders.form.filesLabel }}
        <span class="field-optional">{{ locale.t.orders.form.optional }}</span>
      </p>

      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,application/pdf"
        class="hidden"
        @change="onFileChange"
      >

      <button
        v-if="files.length < MAX_FILES"
        type="button"
        class="glass-field flex w-full flex-col items-center gap-1.5 rounded-2xl px-4 py-5 text-center"
        :disabled="isUploading"
        @click="pickFile"
      >
        <Loader2
          v-if="isUploading"
          class="size-5 animate-spin text-primary"
        />
        <CloudUpload
          v-else
          class="size-5 text-primary"
        />
        <span class="text-[13.5px] font-semibold text-foreground">{{ locale.t.orders.wizard.filesDrop }}</span>
        <span class="text-[11.5px] text-muted-foreground">{{ locale.t.orders.wizard.filesHint }}</span>
      </button>

      <ul
        v-if="files.length"
        class="space-y-2"
      >
        <li
          v-for="(file, index) in files"
          :key="file.id"
          class="flex items-center gap-2.5 rounded-2xl bg-secondary/60 px-3 py-2"
        >
          <ImageIcon
            v-if="isImageFile(file.mime)"
            class="size-4 shrink-0 text-primary"
          />
          <FileText
            v-else
            class="size-4 shrink-0 text-primary"
          />
          <span class="min-w-0 flex-1 truncate text-[13px] text-foreground">{{ file.name }}</span>
          <span class="shrink-0 text-[11.5px] text-muted-foreground">{{ formatFileSize(file.size) }}</span>
          <button
            type="button"
            class="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition active:scale-90"
            :aria-label="locale.t.chat.removeAttachment"
            @click="removeFile(index)"
          >
            <X class="size-4" />
          </button>
        </li>
      </ul>
    </GlassCard>

    <!-- 4 · Region (optional) — hidden, city is fixed to Tashkent -->
    <GlassCard
      v-if="SHOW_REGION_PICKER"
      class="space-y-2.5"
    >
      <p class="field-label">
        {{ locale.t.orders.wizard.regionLabel }}
        <span class="field-optional">{{ locale.t.orders.form.optional }}</span>
      </p>

      <button
        type="button"
        class="picker"
        @click="haptic('light'); regionOpen = true"
      >
        <span
          class="picker__value"
          :class="selectedRegion ? '' : 'picker__value--empty'"
        >
          {{ selectedRegion ? regionName(selectedRegion, locale.locale) : locale.t.orders.form.regionPlaceholder }}
        </span>
        <ChevronRight class="size-[18px] shrink-0 text-muted-foreground" />
      </button>
    </GlassCard>

    <!-- 5 · Map pin (optional) — hidden for the MVP -->
    <GlassCard
      v-if="SHOW_LOCATION_PICKER"
      class="space-y-2.5"
    >
      <p class="field-label">
        {{ locale.t.orders.wizard.locationLabel }}
        <span class="field-optional">{{ locale.t.orders.form.optional }}</span>
      </p>

      <button
        v-if="!mapOpen"
        type="button"
        class="picker"
        @click="haptic('light'); mapOpen = true"
      >
        <MapPin class="size-[18px] shrink-0 text-primary" />
        <span
          class="picker__value"
          :class="location ? '' : 'picker__value--empty'"
        >
          {{ location?.label ?? (location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : locale.t.orders.form.locationOnMap) }}
        </span>
        <ChevronRight class="size-[18px] shrink-0 text-muted-foreground" />
      </button>

      <template v-else>
        <LocationPicker
          :lat="location?.lat ?? null"
          :lng="location?.lng ?? null"
          @change="onLocationChange"
        />
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="glass-chip flex-1 rounded-2xl px-3 py-2 text-[12.5px] font-semibold"
            @click="haptic('light'); mapOpen = false"
          >
            {{ locale.t.orders.form.locationHide }}
          </button>
          <button
            v-if="location"
            type="button"
            class="glass-chip rounded-2xl px-3 py-2 text-[12.5px] font-semibold text-destructive"
            @click="clearLocation"
          >
            {{ locale.t.orders.form.locationClear }}
          </button>
        </div>
      </template>
    </GlassCard>

    <StickyActionBar class="action-dock !bottom-3">
      <button
        type="button"
        class="rb-cta-btn w-full"
        :disabled="submitting"
        @click="submit"
      >
        <Loader2
          v-if="submitting"
          class="size-4 animate-spin"
        />
        <Send
          v-else
          class="size-4"
        />
        {{ locale.t.orders.form.submit }}
      </button>
    </StickyActionBar>

    <!-- Category drawer -->
    <Drawer
      v-model:open="categoryOpen"
      :title="locale.t.orders.wizard.serviceTitle"
    >
      <div class="px-5 pb-2">
        <div class="glass-input flex h-11 items-center gap-2.5 !py-0">
          <Search class="size-4 shrink-0 text-muted-foreground" />
          <input
            v-model="categoryQuery"
            type="search"
            autocomplete="off"
            :placeholder="locale.t.orders.wizard.serviceSearchPlaceholder"
            class="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          >
        </div>
      </div>

      <div class="min-h-0 flex-1 space-y-1 overflow-y-auto px-5 pb-2 pt-1">
        <button
          type="button"
          class="option"
          @click="pickCategory(null)"
        >
          <span class="option__label">{{ locale.t.orders.form.categoryPlaceholder }}</span>
          <Check
            v-if="categoryId === null"
            class="size-[18px] shrink-0 text-primary"
          />
        </button>

        <button
          v-for="category in filteredCategories"
          :key="category.id"
          type="button"
          class="option"
          @click="pickCategory(category.id)"
        >
          <span class="option__icon">
            <CategoryThumb :category="category" :size="18" />
          </span>
          <span class="option__label">{{ categoryName(category, locale.locale) }}</span>
          <Check
            v-if="categoryId === category.id"
            class="size-[18px] shrink-0 text-primary"
          />
        </button>
      </div>
    </Drawer>

    <!-- Region drawer — regions and Tashkent city only, no districts -->
    <Drawer
      v-model:open="regionOpen"
      :title="locale.t.orders.wizard.pickRegionTitle"
    >
      <div class="min-h-0 flex-1 space-y-1 overflow-y-auto px-5 pb-2 pt-1">
        <button
          type="button"
          class="option"
          @click="pickRegion(null)"
        >
          <span class="option__label">{{ locale.t.orders.wizard.allUzbekistan }}</span>
          <Check
            v-if="regionId === null"
            class="size-[18px] shrink-0 text-primary"
          />
        </button>

        <button
          v-for="region in regions"
          :key="region.id"
          type="button"
          class="option"
          @click="pickRegion(region.id)"
        >
          <span class="option__label">{{ regionName(region, locale.locale) }}</span>
          <Check
            v-if="regionId === region.id"
            class="size-[18px] shrink-0 text-primary"
          />
        </button>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
/* The submit button rides the bottom of the viewport; its own backdrop keeps
   the fields from showing through. */
.action-dock {
  margin-inline: -4px;
  padding: 22px 4px calc(10px + env(safe-area-inset-bottom));
  background: linear-gradient(
    to top,
    var(--background) 62%,
    color-mix(in srgb, var(--background) 80%, transparent) 84%,
    transparent
  );
}

.field-label {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--foreground);
}
.route-hint {
  margin: 0;
  padding: 10px 14px;
  border-radius: var(--rb-r-field);
  background: var(--secondary);
  color: var(--muted-foreground);
  font-size: 12.5px;
  line-height: 1.45;
}
.field-optional {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--muted-foreground);
}

.picker {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  padding: 0 12px;
  border-radius: var(--rb-r-field);
  border: 1px solid var(--border);
  background: var(--card);
  cursor: pointer;
  text-align: left;
  transition: border-color var(--rb-dur) var(--rb-ease), transform var(--rb-dur) var(--rb-ease);
}
.picker:active { transform: scale(0.995); }
.picker:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

.picker__icon {
  display: grid;
  place-items: center;
  overflow: hidden;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--rb-r-icon);
  background: var(--secondary);
  color: var(--primary);
}
.picker__value {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.picker__value--empty { font-weight: 500; color: var(--muted-foreground); }

.option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 50px;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--rb-r-tile);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background var(--rb-dur) var(--rb-ease);
}
.option:active { background: color-mix(in oklab, var(--primary) 8%, transparent); }
.option__icon {
  display: grid;
  place-items: center;
  overflow: hidden;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: var(--rb-r-icon);
  background: var(--secondary);
  color: var(--primary);
}
.option__label {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground);
}
</style>
