<script setup lang="ts">
import { Check, Loader2 } from '@lucide/vue'
import { reactive, ref } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import ImageUpload from '@/core/ui/ImageUpload.vue'
import StickyActionBar from '@/core/ui/StickyActionBar.vue'
import LocationPicker from '@/core/ui/LocationPicker.vue'
import { Button } from '@/core/ui/button'
import { cn } from '@/core/lib/utils'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import type {
  AgentDetailsPayload,
  AgentProfile,
  Category,
} from '@/modules/agent/types/agent'

const locale = useLocaleStore()

const props = defineProps<{
  profile: AgentProfile
  categories: Category[]
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [payload: AgentDetailsPayload]
}>()

const form = reactive({
  company_logo_file_id: props.profile.company_logo_file_id,
  bio: props.profile.bio ?? '',
  website_url: props.profile.website_url ?? '',
  linkedin_url: props.profile.linkedin_url ?? '',
  location_label: props.profile.location_label ?? '',
  lat: props.profile.lat !== null ? Number(props.profile.lat) : null as number | null,
  lng: props.profile.lng !== null ? Number(props.profile.lng) : null as number | null,
  results_text: props.profile.results_text ?? '',
})

const selectedCategoryIds = ref<number[]>(props.profile.categories.map((c) => c.id))

function toggleCategory(id: number) {
  const index = selectedCategoryIds.value.indexOf(id)
  if (index === -1) selectedCategoryIds.value.push(id)
  else selectedCategoryIds.value.splice(index, 1)
}

function onLocationPicked(value: { lat: number; lng: number; address: string | null }) {
  form.lat = value.lat
  form.lng = value.lng
  if (value.address && form.location_label.trim() === '') {
    form.location_label = value.address
  }
}

function handleSave() {
  emit('save', {
    company_logo_file_id: form.company_logo_file_id,
    bio: form.bio.trim() || null,
    website_url: form.website_url.trim() || null,
    linkedin_url: form.linkedin_url.trim() || null,
    location_label: form.location_label.trim() || null,
    lat: form.lat,
    lng: form.lng,
    results_text: form.results_text.trim() || null,
    category_ids: [...selectedCategoryIds.value],
  })
}

const inputClass = 'glass-input'
</script>

<template>
  <form
    class="space-y-4"
    @submit.prevent="handleSave"
  >
    <GlassCard class="space-y-4">
      <p class="text-sm font-semibold">
        {{ locale.t.designer.brand }}
      </p>
      <ImageUpload
        v-model="form.company_logo_file_id"
        :label="locale.t.designer.studioLogo"
        :hint="locale.t.designer.logoHint"
        :preview-url="profile.company_logo"
      />

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="designer_bio"
        >{{ locale.t.designer.aboutStudio }}</label>
        <textarea
          id="designer_bio"
          v-model="form.bio"
          rows="3"
          :placeholder="locale.t.designer.aboutPlaceholder"
          :class="cn(inputClass, 'resize-none')"
        />
      </div>

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="designer_results_text"
        >{{ locale.t.designer.resultsHighlights }}</label>
        <textarea
          id="designer_results_text"
          v-model="form.results_text"
          rows="2"
          :placeholder="locale.t.designer.resultsPlaceholder"
          :class="cn(inputClass, 'resize-none')"
        />
      </div>
    </GlassCard>

    <GlassCard class="space-y-3">
      <div>
        <p class="text-sm font-semibold">
          {{ locale.t.designer.serviceCategories }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ locale.t.designer.servicePickHint }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          :class="cn(
            'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition',
            selectedCategoryIds.includes(category.id)
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'glass-chip',
          )"
          @click="toggleCategory(category.id)"
        >
          <Check
            v-if="selectedCategoryIds.includes(category.id)"
            class="size-3.5"
          />
          {{ categoryName(category, locale.locale) }}
        </button>
      </div>
    </GlassCard>

    <GlassCard class="space-y-4">
      <p class="text-sm font-semibold">
        {{ locale.t.designer.linksLocation }}
      </p>
      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="designer_website_url"
        >{{ locale.t.designer.website }}</label>
        <input
          id="designer_website_url"
          v-model="form.website_url"
          type="url"
          inputmode="url"
          placeholder="https://behance.net/…"
          :class="inputClass"
        >
      </div>

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="designer_linkedin_url"
        >{{ locale.t.designer.linkedin }}</label>
        <input
          id="designer_linkedin_url"
          v-model="form.linkedin_url"
          type="url"
          inputmode="url"
          placeholder="https://dribbble.com/…"
          :class="inputClass"
        >
      </div>

      <div class="space-y-2">
        <label
          class="text-sm font-medium"
          for="designer_location_label"
        >{{ locale.t.designer.location }}</label>
        <LocationPicker
          :lat="form.lat"
          :lng="form.lng"
          @change="onLocationPicked"
        />
        <input
          id="designer_location_label"
          v-model="form.location_label"
          type="text"
          :placeholder="locale.t.designer.locationPlaceholder"
          :class="inputClass"
        >
      </div>
    </GlassCard>

    <StickyActionBar>
      <Button
        type="submit"
        class="h-12 w-full rounded-2xl text-base shadow-lg shadow-primary/20"
        :disabled="saving"
      >
        <Loader2
          v-if="saving"
          class="size-4 animate-spin"
        />
        {{ saving ? locale.t.designer.saving : locale.t.designer.saveProfile }}
      </Button>
    </StickyActionBar>
  </form>
</template>
