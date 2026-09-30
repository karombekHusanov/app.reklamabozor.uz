<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check, ChevronRight, FileText, ImageIcon, Loader2, MapPin, Paperclip, Pencil, Search, Send, X, Zap } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import DateRangePicker from '@/core/ui/DateRangePicker.vue'
import Drawer from '@/core/ui/Drawer.vue'
import LocationPicker from '@/core/ui/LocationPicker.vue'
import { useFileUpload } from '@/core/composables/useFileUpload'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { categoryName } from '@/core/i18n/category-name'
import { regionName } from '@/core/i18n/region-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatMoneyInput, parseMoneyInput } from '@/core/lib/money'
import { formatDeadlineRange } from '@/modules/orders/lib/order-terms'
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
  /** Tender | Tezkor — chosen on the first step (tabs live in the `route-tabs` slot). */
  route: OrderRoute
}>()

const emit = defineEmits<{
  submit: [payload: CreateOrderPayload]
}>()

const MAX_FILES = 5
const MIN_DESCRIPTION = 10
const BUDGET_PRESETS = [1_000_000, 3_000_000, 5_000_000, 10_000_000]
const TASHKENT_REGION_CODE = 'toshkent-shahri'

// Six steps, one question each. 1–5 are required; 6 (extras) never blocks.
type StepKey = 'category' | 'description' | 'deadline' | 'budget' | 'location' | 'extras'
const STEP_KEYS: StepKey[] = ['category', 'description', 'deadline', 'budget', 'location', 'extras']
const TOTAL = STEP_KEYS.length

const locale = useLocaleStore()
const { haptic } = useTelegram()
const { isUploading, upload } = useFileUpload()
const orderDraft = useOrderDraftStore()
const toast = useToast()

interface DraftFile { id: number, url: string, name: string, mime: string | null, size: number }

const step = ref(0)
const direction = ref<'fwd' | 'back'>('fwd')
const categoryId = ref<number | null>(null)
const categoryQuery = ref('')
const description = ref('')
const deadlineFrom = ref<string | null>(null)
const deadlineTo = ref<string | null>(null)
const budgetDisplay = ref('')
const files = ref<DraftFile[]>([])
const regionId = ref<number | null>(null)
const location = ref<{ lat: number, lng: number, label: string | null } | null>(null)

const error = ref<string | null>(null)
const regionOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const t = computed(() => locale.t.orders.form)
const budget = computed(() => parseMoneyInput(budgetDisplay.value))
const isLast = computed(() => step.value === TOTAL - 1)

const QUESTIONS = computed(() => [t.value.q1, t.value.q2, t.value.q3, t.value.q4, t.value.q5, t.value.q6])
const question = computed(() => QUESTIONS.value[step.value])

const selectedCategory = computed(() =>
  props.categories.find(category => category.id === categoryId.value) ?? null,
)
const otherSelected = computed(() => !!selectedCategory.value?.is_other)
const routeLabel = computed(() => (props.route === 'tender' ? locale.t.route.tender : locale.t.route.tezkor))
const routeNote = computed(() => (props.route === 'tender' ? locale.t.route.formTender : locale.t.route.formTezkor))

const tashkentRegion = computed(() =>
  props.regions.find(region => region.code === TASHKENT_REGION_CODE) ?? null,
)

// Preselect Tashkent once the regions arrive — until the client picks.
const regionTouched = ref(false)
watch(tashkentRegion, (tashkent) => {
  if (tashkent && !regionTouched.value && regionId.value === null) regionId.value = tashkent.id
}, { immediate: true })

const selectedRegion = computed(() =>
  props.regions.find(region => region.id === regionId.value) ?? null,
)

const filteredCategories = computed(() => {
  const query = categoryQuery.value.trim().toLowerCase()
  const list = query
    ? props.categories.filter(category =>
      category.name_uz.toLowerCase().includes(query)
      || category.name_ru.toLowerCase().includes(query),
    )
    : props.categories

  // The catch-all always closes the list, whatever the backend order.
  return [...list.filter(c => !c.is_other), ...list.filter(c => c.is_other)]
})

const deadlineText = computed(() => formatDeadlineRange(deadlineFrom.value, deadlineTo.value, locale.locale))
const deadlineDays = computed(() =>
  deadlineFrom.value && deadlineTo.value
    ? Math.round((Date.parse(deadlineTo.value) - Date.parse(deadlineFrom.value)) / 86_400_000) + 1
    : 0,
)
const placeTitle = computed(() =>
  location.value ? (location.value.label ?? `${location.value.lat.toFixed(4)}, ${location.value.lng.toFixed(4)}`) : '',
)

// A draft handed over by the AI assistant pre-fills the form once; the client
// still reviews and sends it themselves.
onMounted(() => {
  const draft = orderDraft.consume()
  if (!draft) return

  description.value = draft.description
  if (draft.category_id !== null && props.categories.some(category => category.id === draft.category_id)) {
    categoryId.value = draft.category_id
    step.value = 1
  }
})

function focusField() {
  const id = STEP_KEYS[step.value] === 'description' ? 'order-description'
    : STEP_KEYS[step.value] === 'budget' ? 'order-budget' : null
  if (id) window.setTimeout(() => document.getElementById(id)?.focus({ preventScroll: true }), 280)
}

function goTo(index: number, dir: 'fwd' | 'back') {
  direction.value = dir
  error.value = null
  step.value = index
  window.scrollTo({ top: 0 })
  focusField()
}

function validateStep(index: number): string | null {
  switch (STEP_KEYS[index]) {
    case 'category': return categoryId.value === null ? t.value.errCategory : null
    case 'description': return description.value.trim().length < MIN_DESCRIPTION ? t.value.errDescription : null
    case 'deadline': return !deadlineFrom.value || !deadlineTo.value ? t.value.errDeadline : null
    case 'budget': return budget.value <= 0 ? t.value.errBudget : null
    case 'location': return !location.value ? t.value.errLocationRequired : null
    default: return null
  }
}

function next() {
  if (isLast.value) return submit()

  const problem = validateStep(step.value)
  if (problem) {
    error.value = problem
    haptic('heavy')
    return
  }

  haptic('light')
  goTo(step.value + 1, 'fwd')
}

function back() {
  if (step.value === 0) return
  haptic('light')
  goTo(step.value - 1, 'back')
}

function pickCategory(id: number) {
  haptic('light')
  categoryId.value = id
  categoryQuery.value = ''
  goTo(1, 'fwd')
}

function onDatesChange(value: { from: string | null, to: string | null }) {
  deadlineFrom.value = value.from
  deadlineTo.value = value.to
  error.value = null
}

function onBudgetInput(event: Event) {
  const input = event.target as HTMLInputElement
  budgetDisplay.value = formatMoneyInput(parseMoneyInput(input.value))
  input.value = budgetDisplay.value
  error.value = null
}

function pickBudgetPreset(amount: number) {
  haptic('light')
  budgetDisplay.value = formatMoneyInput(amount)
  error.value = null
}

function onLocationChange(value: { lat: number, lng: number, address: string | null }) {
  location.value = { lat: value.lat, lng: value.lng, label: value.address }
  error.value = null
}

function pickRegion(id: number | null) {
  haptic('light')
  regionTouched.value = true
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

function submit() {
  // Steps are only passed once valid, but an AI draft or a fast tap can leave a
  // gap — jump back to the first invalid step instead of sending a bad request.
  const bad = STEP_KEYS.findIndex((_, index) => validateStep(index) !== null)
  if (bad !== -1) {
    haptic('heavy')
    toast.error(t.value.fixFields)
    goTo(bad, 'back')
    error.value = validateStep(bad)
    return
  }

  emit('submit', {
    category_id: categoryId.value!,
    description: description.value.trim(),
    route: props.route,
    attachment_file_ids: files.value.map(file => file.id),
    budget: budget.value,
    deadline_from: deadlineFrom.value!,
    deadline_to: deadlineTo.value!,
    lat: location.value!.lat,
    lng: location.value!.lng,
    location_label: location.value!.label,
    ...(regionId.value !== null ? { region_id: regionId.value } : {}),
    ...(props.targetAgent ? { agent_profile_id: props.targetAgent.id } : {}),
  })
}
</script>

<template>
  <div
    class="wiz"
    :class="{ 'wiz--docked': step > 0 }"
  >
    <!-- Tender | Tezkor switch — only rendered by the page for accounts with Tender access -->
    <slot
      v-if="step === 0"
      name="route-tabs"
    />

    <div
      v-if="targetAgent"
      class="wiz__directed"
    >
      <span>{{ locale.t.orders.wizard.directedTo }}</span>
      <b>{{ targetAgent.company_name }}</b>
    </div>

    <!-- Later steps: the chosen route and service as chips -->
    <div
      v-if="step > 0"
      class="wiz__chips"
    >
      <span class="chip chip--route">
        <Zap
          v-if="route === 'tezkor'"
          class="size-3.5"
        />
        <FileText
          v-else
          class="size-3.5"
        />
        {{ routeLabel }}
      </span>
      <button
        type="button"
        class="chip chip--cat"
        @click="goTo(0, 'back')"
      >
        {{ selectedCategory ? categoryName(selectedCategory, locale.locale) : '' }}
        <Pencil class="size-3" />
      </button>
    </div>

    <div
      class="wiz__top"
      role="progressbar"
      :aria-valuenow="step + 1"
      :aria-valuemin="1"
      :aria-valuemax="TOTAL"
    >
      <div class="wiz__track">
        <span
          class="wiz__fill"
          :style="{ width: `${((step + 1) / TOTAL) * 100}%` }"
        />
      </div>
      <span class="wiz__count">{{ step + 1 }}/{{ TOTAL }}</span>
    </div>

    <div class="space-y-1.5">
      <h2 class="wiz__q">
        {{ question }}
      </h2>
      <p
        v-if="step === 0"
        class="wiz__note"
      >
        {{ routeNote }}
      </p>
      <p
        v-else-if="isLast"
        class="wiz__note"
      >
        {{ t.skipExtras }}
      </p>
    </div>

    <Transition
      :name="direction === 'fwd' ? 'wiz-fwd' : 'wiz-back'"
      mode="out-in"
    >
      <!-- 1 · Service -->
      <div
        v-if="step === 0"
        key="s0"
        class="space-y-1"
      >
        <label class="search-field">
          <Search class="size-5 shrink-0" />
          <input
            v-model="categoryQuery"
            type="search"
            autocomplete="off"
            enterkeyhint="search"
            :placeholder="locale.t.orders.wizard.serviceSearchPlaceholder"
          >
        </label>

        <p class="wiz__caption">
          {{ categoryQuery.trim() ? '' : t.popular }}
        </p>

        <ul class="svc-list">
          <li
            v-for="category in filteredCategories"
            :key="category.id"
          >
            <button
              type="button"
              class="svc"
              @click="pickCategory(category.id)"
            >
              <span>{{ categoryName(category, locale.locale) }}</span>
              <span
                v-if="category.is_other"
                class="svc__badge"
              >{{ t.otherBadge }}</span>
            </button>
          </li>
        </ul>

        <p
          v-if="filteredCategories.length === 0"
          class="wiz__note"
        >
          {{ locale.t.orders.wizard.serviceSearchEmpty }}
        </p>
      </div>

      <!-- 2 · Description -->
      <div
        v-else-if="step === 1"
        key="s1"
        class="space-y-2.5"
      >
        <p
          v-if="otherSelected"
          class="wiz__tint"
        >
          {{ t.categoryHintOther }}
        </p>
        <textarea
          id="order-description"
          v-model="description"
          rows="7"
          maxlength="2000"
          class="big-field"
          :class="{ 'is-invalid': error }"
          :placeholder="t.descriptionPlaceholder"
          :aria-invalid="!!error"
          @input="error = null"
        />
        <p
          v-if="error"
          class="wiz__error"
          role="alert"
        >
          {{ error }}
        </p>
        <p
          v-else
          class="wiz__note flex justify-between"
        >
          <span>{{ t.descriptionHint }}</span>
          <span class="tabular-nums">{{ description.length }}/2000</span>
        </p>
      </div>

      <!-- 3 · Deadline -->
      <div
        v-else-if="step === 2"
        key="s2"
        class="space-y-2.5"
      >
        <DateRangePicker
          :from="deadlineFrom"
          :to="deadlineTo"
          @change="onDatesChange"
        />
        <p
          v-if="error"
          class="wiz__error"
          role="alert"
        >
          {{ error }}
        </p>
      </div>

      <!-- 4 · Budget -->
      <div
        v-else-if="step === 3"
        key="s3"
        class="space-y-3.5"
      >
        <div
          class="budget"
          :class="{ 'is-invalid': error }"
        >
          <input
            id="order-budget"
            :value="budgetDisplay"
            :style="{ width: `${Math.max(budgetDisplay.length + 1, 9)}ch` }"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            class="budget__field"
            :placeholder="t.budgetPlaceholder"
            :aria-label="t.budgetLabel"
            @input="onBudgetInput"
          >
          <span class="budget__suffix">{{ t.budgetSuffix }}</span>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="amount in BUDGET_PRESETS"
            :key="amount"
            type="button"
            class="pre"
            :class="budget === amount ? 'pre--on' : ''"
            @click="pickBudgetPreset(amount)"
          >
            {{ formatMoneyInput(amount) }}
          </button>
        </div>

        <p
          v-if="error"
          class="wiz__error"
          role="alert"
        >
          {{ error }}
        </p>
        <p
          v-else
          class="wiz__note"
        >
          {{ t.budgetHint }} {{ t.budgetVisible }}
        </p>
      </div>

      <!-- 5 · Place -->
      <div
        v-else-if="step === 4"
        key="s4"
        class="space-y-3"
      >
        <div :class="{ 'is-invalid-box': error }">
          <LocationPicker
            :lat="location?.lat ?? null"
            :lng="location?.lng ?? null"
            @change="onLocationChange"
          />
        </div>

        <div
          v-if="location"
          class="place"
        >
          <MapPin class="size-5 shrink-0 text-primary" />
          <span class="min-w-0 flex-1">{{ placeTitle }}</span>
          <Check class="size-4 shrink-0 text-primary" />
        </div>
        <p
          v-else-if="error"
          class="wiz__error"
          role="alert"
        >
          {{ error }}
        </p>
        <p
          v-else
          class="wiz__note"
        >
          {{ t.locationRequiredHint }}
        </p>
      </div>

      <!-- 6 · Extras + review -->
      <div
        v-else
        key="s5"
        class="space-y-2.5"
      >
        <button
          type="button"
          class="frow"
          @click="haptic('light'); regionOpen = true"
        >
          <MapPin class="frow__icon" />
          <span class="frow__value">{{ selectedRegion ? regionName(selectedRegion, locale.locale) : t.regionPlaceholder }}</span>
          <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
        </button>

        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,application/pdf"
          class="hidden"
          @change="onFileChange"
        >

        <ul
          v-if="files.length"
          class="space-y-2.5"
        >
          <li
            v-for="(file, index) in files"
            :key="file.id"
            class="frow"
          >
            <ImageIcon
              v-if="isImageFile(file.mime)"
              class="frow__icon text-primary"
            />
            <FileText
              v-else
              class="frow__icon text-primary"
            />
            <span class="frow__value">{{ file.name }}</span>
            <span class="shrink-0 text-[12px] text-muted-foreground">{{ formatFileSize(file.size) }}</span>
            <button
              type="button"
              class="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground"
              :aria-label="locale.t.chat.removeAttachment"
              @click="removeFile(index)"
            >
              <X class="size-4" />
            </button>
          </li>
        </ul>

        <button
          v-if="files.length < MAX_FILES"
          type="button"
          class="frow"
          :disabled="isUploading"
          @click="pickFile"
        >
          <Loader2
            v-if="isUploading"
            class="frow__icon animate-spin"
          />
          <Paperclip
            v-else
            class="frow__icon"
          />
          <span class="frow__value frow__value--empty">{{ t.addFiles }}</span>
        </button>

        <div class="review">
          <p class="review__title">
            {{ t.reviewTitle }}
          </p>
          <div class="review__row">
            <span>{{ t.deadlineLabel }}</span>
            <b>{{ deadlineText }}<template v-if="deadlineDays"> · {{ deadlineDays }} {{ t.daysSuffix }}</template></b>
          </div>
          <div class="review__row">
            <span>{{ t.budgetLabel }}</span>
            <b>{{ budgetDisplay }} {{ t.budgetSuffix }}</b>
          </div>
          <div class="review__row">
            <span>{{ locale.t.orders.factLocation }}</span>
            <b class="truncate">{{ placeTitle }}</b>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Bottom sheet dock — step 1 advances by tapping a service, so no button there -->
    <div
      v-if="step > 0"
      class="dock"
    >
      <div class="dock__inner">
        <button
          type="button"
          class="dock__back"
          @click="back"
        >
          <ArrowLeft class="size-4" />
          {{ locale.t.common.back }}
        </button>
        <button
          type="button"
          class="dock__cta"
          :disabled="submitting || isUploading"
          @click="next"
        >
          <Loader2
            v-if="submitting"
            class="size-4 animate-spin"
          />
          <Send
            v-else-if="isLast"
            class="size-[18px]"
          />
          {{ isLast ? t.submit : locale.t.common.next }}
          <ArrowRight
            v-if="!isLast"
            class="size-[18px]"
          />
        </button>
      </div>
    </div>

    <!-- Region sheet — regions and Tashkent city only, no districts -->
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
.wiz { display: flex; flex-direction: column; gap: 16px; }
.wiz--docked { padding-bottom: 6.5rem; }
.wiz__directed { display: flex; gap: 6px; padding: 10px 14px; border-radius: 16px; background: var(--secondary); font-size: 13px; color: var(--muted-foreground); }
.wiz__directed b { color: var(--foreground); }
.wiz__chips { display: flex; align-items: center; gap: 8px; }
.chip { display: inline-flex; align-items: center; gap: 6px; min-height: 30px; padding: 0 12px; border: 0; border-radius: 999px; font-size: 12.5px; font-weight: 700; }
.chip--route { background: var(--secondary); color: var(--foreground); }
.chip--cat { background: color-mix(in oklab, var(--primary) 12%, transparent); color: var(--primary); cursor: pointer; }
.wiz__top { display: flex; align-items: center; gap: 10px; }
.wiz__track { flex: 1; height: 4px; border-radius: 999px; background: var(--border); overflow: hidden; }
.wiz__fill { display: block; height: 100%; border-radius: 999px; background: var(--primary); transition: width 260ms var(--rb-ease); }
.wiz__count { font-size: 12.5px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--muted-foreground); }
.wiz__q { margin: 0; font-family: var(--rb-font-display); font-size: 20px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.25; color: var(--foreground); }
.wiz__note { margin: 0; font-size: 13px; line-height: 1.45; color: var(--muted-foreground); }
.wiz__caption { margin: 14px 4px 0; min-height: 18px; font-size: 13px; font-weight: 700; color: var(--muted-foreground); }
.wiz__error { margin: 0 4px; font-size: 12.5px; font-weight: 600; color: var(--destructive); }
.wiz__tint { margin: 0; padding: 10px 14px; border-radius: 14px; background: color-mix(in oklab, var(--primary) 8%, transparent); font-size: 13px; line-height: 1.45; color: var(--foreground); }

.search-field { display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 0 16px; border-radius: 18px; background: var(--secondary); color: var(--muted-foreground); }
.search-field:focus-within { box-shadow: 0 0 0 2px var(--primary); }
.search-field input { flex: 1; min-width: 0; background: transparent; outline: none; font-size: 18px; font-weight: 500; color: var(--foreground); }
.svc-list { margin: 0; padding: 0; list-style: none; }
.svc {
  display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; min-height: 54px; padding: 0 4px;
  border: 0; border-bottom: 1px solid color-mix(in oklab, var(--border) 70%, transparent); background: none;
  text-align: left; font-size: 18px; font-weight: 500; color: var(--foreground); cursor: pointer;
}
.svc:active { opacity: 0.55; }
.svc__badge { padding: 3px 10px; border-radius: 999px; background: var(--secondary); color: var(--primary); font-size: 12px; font-weight: 700; }

.big-field {
  width: 100%; min-height: 230px; padding: 16px; resize: none; outline: none;
  border: 1.5px solid var(--border); border-radius: 20px; background: var(--card);
  font-size: 17px; line-height: 1.5; color: var(--foreground);
}
.big-field:focus { border-color: var(--primary); box-shadow: 0 0 0 4px color-mix(in oklab, var(--primary) 10%, transparent); }
.is-invalid { border-color: var(--destructive) !important; }
.is-invalid-box { border-radius: 16px; box-shadow: 0 0 0 1.5px var(--destructive); }

.budget { display: flex; align-items: baseline; justify-content: center; gap: 8px; padding: 26px 16px; border: 1.5px solid var(--border); border-radius: 22px; background: var(--card); }
.budget:focus-within { border-color: var(--primary); box-shadow: 0 0 0 4px color-mix(in oklab, var(--primary) 10%, transparent); }
.budget__field { flex: 0 1 auto; min-width: 0; max-width: 100%; background: transparent; outline: none; text-align: right; font-size: 38px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--foreground); }
.budget__field::placeholder { font-weight: 500; color: var(--muted-foreground); }
.budget__suffix { font-size: 17px; font-weight: 600; color: var(--muted-foreground); }
.pre { min-height: 38px; padding: 0 14px; border: 0; border-radius: 999px; background: var(--secondary); font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--foreground); cursor: pointer; }
.pre--on { background: var(--primary); color: var(--primary-foreground); }

.place { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 18px; background: var(--card); font-size: 14px; font-weight: 600; color: var(--foreground); box-shadow: var(--rb-elev-1); }

.frow { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; padding: 0 16px; border: 0; border-radius: 18px; background: var(--secondary); text-align: left; font-size: 16px; color: var(--foreground); cursor: pointer; }
.frow__icon { width: 22px; height: 22px; flex-shrink: 0; color: var(--muted-foreground); }
.frow__value { flex: 1; min-width: 0; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.frow__value--empty { color: var(--muted-foreground); font-weight: 400; }

.review { margin-top: 8px; padding: 6px 16px; border-radius: 20px; background: var(--card); box-shadow: var(--rb-elev-1); }
.review__title { margin: 0; padding: 8px 0 2px; font-size: 12.5px; font-weight: 700; color: var(--muted-foreground); }
.review__row { display: flex; align-items: center; justify-content: space-between; gap: 14px; min-height: 40px; font-size: 14.5px; }
.review__row + .review__row { border-top: 1px solid var(--border); }
.review__row span { color: var(--muted-foreground); }
.review__row b { min-width: 0; font-weight: 700; font-variant-numeric: tabular-nums; }

/* Bottom-sheet dock */
.dock { position: fixed; bottom: 0; left: 50%; z-index: 30; width: 100%; max-width: 32rem; transform: translateX(-50%); }
.dock__inner { display: flex; align-items: center; gap: 14px; padding: 14px 20px calc(16px + env(safe-area-inset-bottom)); border-radius: 28px 28px 0 0; background: var(--card); box-shadow: 0 -10px 30px -18px rgba(15, 23, 42, 0.3); }
.dock__back { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; min-height: 52px; padding: 0 4px; border: 0; background: none; font-size: 14.5px; font-weight: 700; color: var(--muted-foreground); cursor: pointer; }
.dock__back:active { opacity: 0.6; }
.dock__cta {
  display: flex; align-items: center; justify-content: center; gap: 8px; flex: 1; min-width: 0; min-height: 52px; border: 0; border-radius: 999px;
  background: linear-gradient(180deg, color-mix(in oklab, var(--primary) 88%, white), var(--primary));
  color: var(--primary-foreground); font-size: 16px; font-weight: 700; cursor: pointer;
  box-shadow: 0 10px 20px -10px color-mix(in oklab, var(--primary) 70%, transparent);
}
.dock__cta:disabled { opacity: 0.6; }
.dock__cta:active { transform: scale(0.98); }

.wiz-fwd-enter-active, .wiz-fwd-leave-active, .wiz-back-enter-active, .wiz-back-leave-active { transition: opacity 160ms ease, transform 160ms ease; }
.wiz-fwd-enter-from, .wiz-back-leave-to { opacity: 0; transform: translateX(16px); }
.wiz-fwd-leave-to, .wiz-back-enter-from { opacity: 0; transform: translateX(-16px); }
@media (prefers-reduced-motion: reduce) {
  .wiz-fwd-enter-active, .wiz-fwd-leave-active, .wiz-back-enter-active, .wiz-back-leave-active { transition: none; }
}

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
