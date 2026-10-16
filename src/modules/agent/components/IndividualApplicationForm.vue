<script setup lang="ts">
import { Check, Loader2 } from '@lucide/vue'
import { reactive, ref } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import FileUpload from '@/core/ui/FileUpload.vue'
import StickyActionBar from '@/core/ui/StickyActionBar.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useToast } from '@/core/composables/useToast'
import { useHideTabBar } from '@/core/composables/useTabBarHidden'
import CategoryCheckboxList from '@/modules/profile/components/edit/CategoryCheckboxList.vue'
import type {
  AgentProfile,
  Category,
  IndividualApplicationPayload,
} from '@/modules/agent/types/agent'

// Individual ("jismoniy") executor application — the light KYC: full name,
// passport + selfie scans and the categories served. Admin-approved; the
// resulting profile works on Tezkor requests (Tender needs the legal track).
const locale = useLocaleStore()
const toast = useToast()

// The submit bar docks where the tab bar normally sits.
useHideTabBar()

const props = defineProps<{
  categories: Category[]
  initial?: AgentProfile | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: IndividualApplicationPayload]
}>()

const form = reactive({
  full_name: props.initial?.director_name ?? '',
  alt_contact: props.initial?.alt_contact ?? '',
  passport_file_id: props.initial?.director_passport_file_id ?? null as number | null,
  selfie_file_id: props.initial?.selfie_file_id ?? null as number | null,
})
const categoryIds = ref<number[]>(props.initial?.categories.map(category => category.id) ?? [])

const fieldErrors = reactive<Record<string, string>>({})

function handleSubmit() {
  Object.keys(fieldErrors).forEach(key => delete fieldErrors[key])

  if (form.full_name.trim() === '') fieldErrors.full_name = locale.t.executor.errFullName
  if (form.passport_file_id === null) fieldErrors.passport_file_id = locale.t.agent.errPassportScan
  if (form.selfie_file_id === null) fieldErrors.selfie_file_id = locale.t.executor.errSelfie
  if (categoryIds.value.length === 0) fieldErrors.category_ids = locale.t.executor.errCategories

  const first = Object.keys(fieldErrors)[0]
  if (first) {
    toast.error(fieldErrors[first])
    document.getElementById(first)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  emit('submit', {
    full_name: form.full_name.trim(),
    alt_contact: form.alt_contact.trim() || null,
    passport_file_id: form.passport_file_id!,
    selfie_file_id: form.selfie_file_id!,
    category_ids: [...categoryIds.value],
  })
}
</script>

<template>
  <form
    class="space-y-4"
    @submit.prevent="handleSubmit"
  >
    <GlassCard class="space-y-4">
      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="full_name"
        >{{ locale.t.agent.fullName }}</label>
        <input
          id="full_name"
          v-model="form.full_name"
          type="text"
          maxlength="200"
          autocomplete="name"
          :placeholder="locale.t.executor.fullNamePlaceholder"
          class="glass-input"
        >
        <p
          v-if="fieldErrors.full_name"
          class="text-xs text-destructive"
        >
          {{ fieldErrors.full_name }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="alt_contact"
        >{{ locale.t.executor.altContact }}</label>
        <input
          id="alt_contact"
          v-model="form.alt_contact"
          type="text"
          maxlength="100"
          :placeholder="locale.t.executor.altContactPlaceholder"
          class="glass-input"
        >
        <p class="text-xs text-muted-foreground">
          {{ locale.t.executor.altContactHint }}
        </p>
      </div>
    </GlassCard>

    <GlassCard class="space-y-4">
      <div id="passport_file_id">
        <FileUpload
          v-model="form.passport_file_id"
          :label="locale.t.agent.passportScan"
          :hint="locale.t.agent.photoOrPdf"
          :current-name="initial?.director_passport_file ? locale.t.agent.passportScanName : null"
          :current-url="initial?.director_passport_file"
          :invalid="!!fieldErrors.passport_file_id"
        />
      </div>
      <div id="selfie_file_id">
        <FileUpload
          v-model="form.selfie_file_id"
          :label="locale.t.executor.selfie"
          :hint="locale.t.executor.selfieHint"
          accept="image/png,image/jpeg,image/webp"
          :current-name="initial?.selfie ? locale.t.executor.selfieName : null"
          :current-url="initial?.selfie"
          :invalid="!!fieldErrors.selfie_file_id"
        />
      </div>
    </GlassCard>

    <GlassCard
      id="category_ids"
      class="space-y-3"
    >
      <div>
        <p class="text-sm font-semibold text-foreground">
          {{ locale.t.executor.categories }}
        </p>
        <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
          {{ locale.t.executor.categoriesHint }}
        </p>
      </div>
      <CategoryCheckboxList
        v-model="categoryIds"
        :categories="categories"
      />
      <p
        v-if="fieldErrors.category_ids"
        class="text-xs text-destructive"
      >
        {{ fieldErrors.category_ids }}
      </p>
    </GlassCard>

    <StickyActionBar class="bottom-4">
      <Button
        type="submit"
        class="h-12 w-full rounded-2xl text-base shadow-lg shadow-primary/20"
        :disabled="submitting"
      >
        <Loader2
          v-if="submitting"
          class="mr-1 size-4 animate-spin"
        />
        <Check
          v-else
          class="mr-1 size-4"
        />
        {{ locale.t.executor.submit }}
      </Button>
    </StickyActionBar>
  </form>
</template>
