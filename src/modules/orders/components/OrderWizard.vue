<script setup lang="ts">
import { ChevronLeft, ChevronRight, Loader2, Send, Store } from '@lucide/vue'
import { computed, provide, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/core/ui/button'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import WizardProgress from '@/modules/orders/components/wizard/WizardProgress.vue'
import ServiceStep from '@/modules/orders/components/wizard/ServiceStep.vue'
import BriefStep from '@/modules/orders/components/wizard/BriefStep.vue'
import FilesStep from '@/modules/orders/components/wizard/FilesStep.vue'
import ReviewStep from '@/modules/orders/components/wizard/ReviewStep.vue'
import { WIZARD_KEY } from '@/modules/orders/components/wizard/context'
import type { Category } from '@/modules/agent/types/agent'
import type { CreateOrderPayload, OrderDraft } from '@/modules/orders/types/order'

const props = defineProps<{
  categories: Category[]
  submitting?: boolean
  /** When set, the order is directed to this single agency (from its profile). */
  targetAgent?: { id: number, company_name: string } | null
}>()

const emit = defineEmits<{
  submit: [payload: CreateOrderPayload]
}>()

const locale = useLocaleStore()
const router = useRouter()
const toast = useToast()
const { haptic } = useTelegram()

const draft = reactive<OrderDraft>({
  category_id: null,
  title: '',
  description: '',
  deadline_date: null,
  budget: null,
  files: [],
})
const errors = reactive<Record<string, string>>({})

provide(WIZARD_KEY, { draft, errors, get categories() { return props.categories } })

// --- Steps ------------------------------------------------------------------
const steps = [ServiceStep, BriefStep, FilesStep, ReviewStep]
const step = ref(0)
const isLast = computed(() => step.value === steps.length - 1)

const stepLabels = computed(() => [
  locale.t.orders.wizard.stepService,
  locale.t.orders.wizard.stepBrief,
  locale.t.orders.wizard.stepFiles,
  locale.t.orders.wizard.stepReview,
])

function validateStep(): boolean {
  Object.keys(errors).forEach(key => delete errors[key])

  if (step.value === 0 && draft.category_id === null) {
    errors.category_id = locale.t.orders.errChooseService
  }
  if (step.value === 1) {
    if (draft.title.trim() === '') errors.title = locale.t.orders.wizard.errProjectName
    if (draft.description.trim() === '') errors.description = locale.t.orders.errComment
  }
  if (step.value === 2 && draft.files.length === 0) {
    errors.files = locale.t.orders.wizard.errFiles
  }

  return Object.keys(errors).length === 0
}

function goBack() {
  haptic('light')
  if (step.value === 0) {
    router.back()
    return
  }
  step.value -= 1
}

function goNext() {
  if (!validateStep()) {
    haptic('heavy')
    // Surface the first error as a toast — inline messages can be off-screen.
    const firstError = Object.values(errors)[0]
    if (firstError) toast.error(firstError)
    return
  }
  haptic('light')

  if (isLast.value) {
    submit()
    return
  }
  step.value += 1
}

function submit() {
  emit('submit', {
    category_id: draft.category_id!,
    description: draft.description.trim(),
    attachment_file_ids: draft.files.map(f => f.id),
    agent_profile_id: props.targetAgent?.id,
    title: draft.title.trim() || undefined,
    deadline_date: draft.deadline_date,
    budget: draft.budget,
  })
}
</script>

<template>
  <div class="space-y-6 pb-[calc(5rem+max(env(safe-area-inset-bottom),1rem))]">
    <!-- Directed order: this order reaches only the chosen agency. -->
    <div
      v-if="targetAgent"
      class="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3"
    >
      <Store class="size-5 shrink-0 text-primary" />
      <p class="text-sm text-foreground">
        {{ locale.t.orders.wizard.directedTo }}
        <span class="font-semibold">{{ targetAgent.company_name }}</span>
      </p>
    </div>

    <WizardProgress
      :current="step"
      :steps="stepLabels"
    />

    <component :is="steps[step]" />

    <div class="wizard-action-dock">
      <GlassCard
        frosted
        padding="none"
        class="wizard-action-shell pointer-events-auto w-full"
      >
        <div class="wizard-action-shell__row">
          <Button
            type="button"
            variant="outline"
            class="wizard-action-btn wizard-action-btn--icon"
            :disabled="submitting"
            :aria-label="locale.t.orders.back"
            @click="goBack"
          >
            <ChevronLeft class="size-5" />
          </Button>

          <Button
            type="button"
            class="wizard-action-btn grow text-base shadow-lg shadow-primary/20"
            :disabled="submitting"
            @click="goNext"
          >
            <Loader2
              v-if="submitting"
              class="size-4 animate-spin"
            />
            <template v-else>
              {{ isLast ? locale.t.orders.wizard.submit : locale.t.common.next }}
              <Send
                v-if="isLast"
                class="size-4"
              />
              <ChevronRight
                v-else
                class="size-5"
              />
            </template>
          </Button>
        </div>
      </GlassCard>
    </div>
  </div>
</template>
