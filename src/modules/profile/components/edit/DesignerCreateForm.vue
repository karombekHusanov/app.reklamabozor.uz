<script setup lang="ts">
import { Check, ChevronLeft, Loader2 } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import StickyActionBar from '@/core/ui/StickyActionBar.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import CategoryCheckboxList from '@/modules/profile/components/edit/CategoryCheckboxList.vue'
import WizardProgress from '@/modules/orders/components/wizard/WizardProgress.vue'
import type { Category, DesignerProfilePayload } from '@/modules/agent/types/agent'

const locale = useLocaleStore()
const toast = useToast()
const { haptic } = useTelegram()

const props = defineProps<{
  categories: Category[]
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: DesignerProfilePayload]
}>()

const step = ref(0)
const stepLabels = computed(() => [
  locale.t.designer.createStepCategories,
  locale.t.designer.createStepProfile,
])

const form = reactive({
  company_name: '',
  bio: '',
})

const selectedCategoryIds = ref<number[]>([])

function goNext() {
  if (selectedCategoryIds.value.length === 0) {
    haptic('heavy')
    toast.error(locale.t.designer.createErrCategories)
    return
  }

  haptic('light')
  step.value = 1
}

function goBack() {
  haptic('light')
  step.value = 0
}

function handleSubmit() {
  if (selectedCategoryIds.value.length === 0 || props.submitting) return

  emit('submit', {
    company_name: form.company_name.trim() || null,
    bio: form.bio.trim() || null,
    category_ids: [...selectedCategoryIds.value],
  })
}
</script>

<template>
  <form
    class="space-y-4"
    @submit.prevent="handleSubmit"
  >
    <GlassCard class="py-4">
      <WizardProgress
        :current="step"
        :steps="stepLabels"
      />
    </GlassCard>

    <GlassCard
      v-if="step === 0"
      class="space-y-3"
    >
      <div>
        <p class="text-sm font-semibold text-foreground">
          {{ locale.t.designer.createCategories }}
        </p>
        <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
          {{ locale.t.designer.createCategoriesHint }}
        </p>
      </div>

      <CategoryCheckboxList
        v-model="selectedCategoryIds"
        :categories="categories"
      />
    </GlassCard>

    <GlassCard
      v-else
      class="space-y-4"
    >
      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="studio_name"
        >{{ locale.t.designer.createStudioName }}</label>
        <input
          id="studio_name"
          v-model="form.company_name"
          type="text"
          maxlength="150"
          :placeholder="locale.t.designer.createStudioPlaceholder"
          class="glass-input profile-form-input"
        >
        <p class="text-xs text-muted-foreground">
          {{ locale.t.designer.createStudioHint }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="designer_bio"
        >{{ locale.t.designer.createBio }}</label>
        <textarea
          id="designer_bio"
          v-model="form.bio"
          rows="8"
          maxlength="2000"
          :placeholder="locale.t.designer.createBioPlaceholder"
          class="glass-input profile-form-textarea profile-form-textarea--lg resize-none"
        />
      </div>
    </GlassCard>

    <StickyActionBar>
      <div
        class="flex gap-2"
        :class="step === 1 ? 'grid grid-cols-[auto_1fr]' : ''"
      >
        <Button
          v-if="step === 1"
          type="button"
          variant="outline"
          class="h-12 rounded-2xl px-4"
          :disabled="submitting"
          @click="goBack"
        >
          <ChevronLeft class="size-5" />
        </Button>

        <Button
          v-if="step === 0"
          type="button"
          class="h-12 w-full rounded-2xl text-base shadow-lg shadow-primary/20"
          @click="goNext"
        >
          {{ locale.t.designer.createNext }}
        </Button>

        <Button
          v-else
          type="submit"
          class="h-12 w-full rounded-2xl text-base shadow-lg shadow-primary/20"
          :disabled="selectedCategoryIds.length === 0 || submitting"
        >
          <Loader2
            v-if="submitting"
            class="mr-1 size-4 animate-spin"
          />
          <Check
            v-else
            class="mr-1 size-4"
          />
          {{ locale.t.designer.createSubmit }}
        </Button>
      </div>
    </StickyActionBar>
  </form>
</template>
