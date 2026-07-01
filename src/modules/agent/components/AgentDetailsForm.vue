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
  // Seed the label from the geocoded address only when the user has not typed one.
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
    <!-- Logo + about -->
    <GlassCard class="space-y-4">
      <p class="text-sm font-semibold">
        {{ locale.t.agent.brand }}
      </p>
      <ImageUpload
        v-model="form.company_logo_file_id"
        :label="locale.t.agent.companyLogo"
        :hint="locale.t.agent.logoHint"
        :preview-url="profile.company_logo"
      />

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="bio"
        >{{ locale.t.agent.aboutCompany }}</label>
        <textarea
          id="bio"
          v-model="form.bio"
          rows="3"
          :placeholder="locale.t.agent.aboutPlaceholder"
          :class="cn(inputClass, 'resize-none')"
        />
      </div>

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="results_text"
        >{{ locale.t.agent.resultsHighlights }}</label>
        <textarea
          id="results_text"
          v-model="form.results_text"
          rows="2"
          :placeholder="locale.t.agent.resultsPlaceholder"
          :class="cn(inputClass, 'resize-none')"
        />
      </div>
    </GlassCard>

    <!-- Categories -->
    <GlassCard class="space-y-3">
      <div>
        <p class="text-sm font-semibold">
          {{ locale.t.agent.serviceCategories }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ locale.t.agent.servicePickHint }}
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

    <!-- Links + location -->
    <GlassCard class="space-y-4">
      <p class="text-sm font-semibold">
        {{ locale.t.agent.linksLocation }}
      </p>
      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="website_url"
        >{{ locale.t.agent.website }}</label>
        <input
          id="website_url"
          v-model="form.website_url"
          type="url"
          inputmode="url"
          placeholder="https://example.uz"
          :class="inputClass"
        >
      </div>

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="linkedin_url"
        >{{ locale.t.agent.linkedin }}</label>
        <input
          id="linkedin_url"
          v-model="form.linkedin_url"
          type="url"
          inputmode="url"
          placeholder="https://linkedin.com/company/…"
          :class="inputClass"
        >
      </div>

      <div class="space-y-2">
        <label
          class="text-sm font-medium"
          for="location_label"
        >{{ locale.t.agent.location }}</label>
        <LocationPicker
          :lat="form.lat"
          :lng="form.lng"
          @change="onLocationPicked"
        />
        <input
          id="location_label"
          v-model="form.location_label"
          type="text"
          :placeholder="locale.t.agent.locationPlaceholder"
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
        {{ saving ? locale.t.agent.saving : locale.t.agent.saveProfile }}
      </Button>
    </StickyActionBar>
  </form>
</template>
