<script setup lang="ts">
import { ChevronDown, ImagePlus, Loader2, MapPin, Plus, X } from '@lucide/vue'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Skeleton from '@/core/ui/Skeleton.vue'
import StickyActionBar from '@/core/ui/StickyActionBar.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import AgentCard from '@/modules/marketplace/components/AgentCard.vue'
import { Button } from '@/core/ui/button'
import { cn } from '@/core/lib/utils'
import { useFileUpload } from '@/core/composables/useFileUpload'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { fetchNearbyAgents, fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'
import type { Category } from '@/modules/agent/types/agent'
import type { CreateOrderPayload, OrderDeadline } from '@/modules/orders/types/order'

const locale = useLocaleStore()
const router = useRouter()

defineProps<{
  categories: Category[]
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: CreateOrderPayload]
}>()

// --- Form state -------------------------------------------------------------
const form = reactive({
  category_id: null as number | null,
  description: '',
  deadline: null as OrderDeadline | null,
})

// Four upload slots — the first filled one becomes the primary brief (TZ).
type Slot = { id: number, url: string | null } | null
const slots = ref<Slot[]>([null, null, null, null])
const activeSlot = ref<number | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const { isUploading, upload } = useFileUpload()

const deadlineOptions: { value: OrderDeadline, label: () => string }[] = [
  { value: 'this_week', label: () => locale.t.orders.deadlineThisWeek },
  { value: 'today_tomorrow', label: () => locale.t.orders.deadlineTodayTomorrow },
]

const fieldErrors = reactive<Record<string, string>>({})

function pickSlot(index: number) {
  if (isUploading.value) return
  activeSlot.value = index
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || activeSlot.value === null) return

  const uploaded = await upload(file)
  if (uploaded) {
    slots.value[activeSlot.value] = { id: uploaded.id, url: uploaded.url }
    delete fieldErrors.files
  }
  target.value = ''
}

function removeSlot(index: number) {
  slots.value[index] = null
}

function selectCategory(id: number) {
  form.category_id = id
  delete fieldErrors.category_id
}

function selectDeadline(value: OrderDeadline) {
  form.deadline = form.deadline === value ? null : value
}

function collectFileIds(): number[] {
  return slots.value.filter((s): s is NonNullable<Slot> => s !== null).map(s => s.id)
}

function validate(): boolean {
  Object.keys(fieldErrors).forEach(key => delete fieldErrors[key])

  if (collectFileIds().length === 0) fieldErrors.files = locale.t.orders.errBrief
  if (form.category_id === null) fieldErrors.category_id = locale.t.orders.errChooseService
  if (form.description.trim() === '') fieldErrors.description = locale.t.orders.errComment

  return Object.keys(fieldErrors).length === 0
}

function handleSubmit() {
  if (!validate()) return

  const fileIds = collectFileIds()

  emit('submit', {
    category_id: form.category_id!,
    description: form.description.trim(),
    deadline: form.deadline,
    tz_file_id: fileIds[0],
    attachment_file_ids: fileIds.slice(1),
  })
}

// --- Location + nearby agencies --------------------------------------------
const coords = ref<{ lat: number, lng: number } | null>(null)
const locating = ref(false)
const nearby = ref<PublicAgent[]>([])
const nearbyLoading = ref(false)

async function loadNearby() {
  nearbyLoading.value = true
  try {
    nearby.value = coords.value
      ? await fetchNearbyAgents(coords.value.lat, coords.value.lng, 5)
      : await fetchTopAgents(5)
  }
  catch {
    nearby.value = []
  }
  finally {
    nearbyLoading.value = false
  }
}

function requestLocation() {
  if (!('geolocation' in navigator)) {
    void loadNearby()
    return
  }

  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      coords.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      locating.value = false
      void loadNearby()
    },
    () => {
      // Permission denied / unavailable — fall back to top agents (no distance).
      locating.value = false
      void loadNearby()
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
  )
}

function openAgent(id: number) {
  router.push(`/agents/${id}`)
}

onMounted(requestLocation)
</script>

<template>
  <form class="space-y-6 text-white" @submit.prevent="handleSubmit">
    <!-- Location -->
    <button
      type="button"
      class="flex items-center gap-1.5 text-lg font-bold text-white"
      @click="requestLocation"
    >
      <MapPin class="size-4 opacity-80" />
      <span>{{ locating ? locale.t.orders.locating : locale.t.orders.locationCity }}</span>
      <ChevronDown class="size-5 opacity-80" />
    </button>

    <!-- File upload slots -->
    <div class="space-y-2">
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        class="hidden"
        @change="onFileChange"
      >
      <div class="grid grid-cols-4 gap-3">
        <div
          v-for="(slot, i) in slots"
          :key="i"
          class="relative aspect-square"
        >
          <div
            v-if="slot"
            class="size-full overflow-hidden rounded-2xl border border-white/20 bg-white/10"
          >
            <img v-if="slot.url" :src="slot.url" alt="" class="size-full object-cover">
            <button
              type="button"
              class="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/50 text-white"
              @click="removeSlot(i)"
            >
              <X class="size-3.5" />
            </button>
          </div>
          <button
            v-else
            type="button"
            class="flex size-full items-center justify-center rounded-2xl border border-white/15 bg-white/15 text-white/70 transition hover:bg-white/20 active:scale-95"
            :disabled="isUploading"
            @click="pickSlot(i)"
          >
            <Loader2 v-if="isUploading && activeSlot === i" class="size-5 animate-spin" />
            <Plus v-else-if="i === 0" class="size-6" />
            <ImagePlus v-else class="size-5" />
          </button>
        </div>
      </div>
      <p class="text-center text-sm font-semibold text-white/90">
        {{ locale.t.orders.uploadTitle }}
      </p>
      <p v-if="fieldErrors.files" class="text-center text-xs text-red-200">
        {{ fieldErrors.files }}
      </p>
    </div>

    <!-- Deadline -->
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="option in deadlineOptions"
          :key="option.value"
          type="button"
          :class="cn(
            'h-12 rounded-2xl text-sm font-semibold transition active:scale-[0.98]',
            form.deadline === option.value
              ? 'bg-white text-primary shadow-lg'
              : 'bg-white/15 text-white hover:bg-white/20',
          )"
          @click="selectDeadline(option.value)"
        >
          {{ option.label() }}
        </button>
      </div>
      <div class="h-px bg-white/15" />
    </div>

    <!-- Category -->
    <div class="space-y-2">
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          :class="cn(
            'h-12 rounded-2xl px-3 text-sm font-semibold transition active:scale-[0.98]',
            form.category_id === category.id
              ? 'bg-white text-primary shadow-lg'
              : 'bg-white/15 text-white hover:bg-white/20',
          )"
          @click="selectCategory(category.id)"
        >
          {{ categoryName(category, locale.locale) }}
        </button>
      </div>
      <p v-if="fieldErrors.category_id" class="text-xs text-red-200">
        {{ fieldErrors.category_id }}
      </p>
    </div>

    <!-- Comment -->
    <div class="space-y-2">
      <label class="text-sm font-medium text-white/90" for="description">
        {{ locale.t.orders.commentLabel }}
      </label>
      <textarea
        id="description"
        v-model="form.description"
        rows="5"
        :placeholder="locale.t.orders.commentPlaceholder"
        class="w-full resize-none rounded-2xl border border-white/25 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/50 focus:border-white/50 focus:bg-white/10"
      />
      <p v-if="fieldErrors.description" class="text-xs text-red-200">
        {{ fieldErrors.description }}
      </p>
    </div>

    <!-- Nearby agencies -->
    <div class="space-y-3">
      <p class="text-sm font-medium text-white/90">
        {{ locale.t.orders.nearbyTitle }}
      </p>

      <Skeleton v-if="nearbyLoading" class="h-24 w-full rounded-3xl" />

      <div v-else-if="nearby.length > 0" class="space-y-3">
        <AgentCard
          v-for="agent in nearby"
          :key="agent.id"
          :agent="agent"
          @open="openAgent(agent.id)"
        />
      </div>

      <EmptyState
        v-else
        :icon="MapPin"
        :title="locale.t.orders.nearbyEmpty"
      />
    </div>

    <StickyActionBar>
      <Button type="submit" class="h-12 w-full rounded-2xl text-base shadow-lg shadow-primary/20" :disabled="submitting">
        <Loader2 v-if="submitting" class="size-4 animate-spin" />
        {{ submitting ? locale.t.orders.sending : locale.t.orders.sendRequest }}
      </Button>
    </StickyActionBar>
  </form>
</template>
