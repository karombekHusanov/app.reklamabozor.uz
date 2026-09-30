<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import FileUpload from '@/core/ui/FileUpload.vue'
import { Button } from '@/core/ui/button'
import { cn } from '@/core/lib/utils'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useToast } from '@/core/composables/useToast'
import { useHideTabBar } from '@/core/composables/useTabBarHidden'
import AgentOfferConsent from '@/modules/agent/components/AgentOfferConsent.vue'
import type {
  AgentApplicationPayload,
  AgentProfile,
} from '@/modules/agent/types/agent'

const locale = useLocaleStore()
const toast = useToast()

// The stepper docks its own fixed action bar where the tab bar normally sits.
useHideTabBar()

const props = defineProps<{
  initial?: AgentProfile | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: AgentApplicationPayload]
}>()

const form = reactive({
  company_name: props.initial?.company_name ?? '',
  legal_form: props.initial?.legal_form ?? '',
  inn: props.initial?.inn ?? '',
  director_name: props.initial?.director_name ?? '',
  director_passport: props.initial?.director_passport ?? '',
  director_passport_file_id: props.initial?.director_passport_file_id ?? null as number | null,
  registration_certificate_file_id: props.initial?.registration_certificate_file_id ?? null as number | null,
  bank_name: props.initial?.bank_name ?? '',
  bank_account: props.initial?.bank_account ?? '',
  mfo: props.initial?.mfo ?? '',
  phone: props.initial?.phone ?? '',
  // Consent is per submission — always starts unchecked, even on resubmit.
  accept_offer: false,
})

const fieldErrors = reactive<Record<string, string>>({})

// Field id → human label, so a validation toast can name the exact field.
const fieldLabels = computed<Record<string, string>>(() => ({
  company_name: locale.t.agent.companyName,
  legal_form: locale.t.agent.legalForm,
  inn: locale.t.agent.innLabel,
  director_name: locale.t.agent.fullName,
  director_passport: locale.t.agent.passport,
  director_passport_file_id: locale.t.agent.passportScan,
  registration_certificate_file_id: locale.t.agent.registrationCert,
  bank_name: locale.t.agent.bankName,
  bank_account: locale.t.agent.accountNumber,
  mfo: locale.t.agent.mfo,
  phone: locale.t.agent.contactPhone,
  accept_offer: locale.t.agent.offerTitle,
}))

// Normalize user formatting (spaces, dashes) before validating numeric / passport fields.
const digits = (value: string) => value.replace(/\D/g, '')
const normalizePassport = (value: string) => value.replace(/\s/g, '').toUpperCase()

const TOTAL_STEPS = 4
const step = ref(1)

// Which fields each step owns (step 4 = consent).
const STEP_FIELDS: Record<number, string[]> = {
  1: ['company_name', 'legal_form', 'inn'],
  2: ['director_name', 'director_passport', 'director_passport_file_id'],
  3: ['registration_certificate_file_id', 'bank_name', 'bank_account', 'mfo', 'phone'],
  4: ['accept_offer'],
}

function collectErrors(): Record<string, string> {
  const errors: Record<string, string> = {}

  if (form.company_name.trim() === '') errors.company_name = locale.t.agent.errCompanyName
  if (form.legal_form.trim() === '') errors.legal_form = locale.t.agent.errLegalForm
  if (!/^\d{9}$/.test(digits(form.inn))) errors.inn = locale.t.agent.errInn
  if (form.director_name.trim() === '') errors.director_name = locale.t.agent.errDirectorName
  if (!/^[A-Z]{2}\d{7}$/.test(normalizePassport(form.director_passport))) {
    errors.director_passport = locale.t.agent.errPassport
  }
  if (form.director_passport_file_id === null) errors.director_passport_file_id = locale.t.agent.errPassportScan
  if (form.registration_certificate_file_id === null) {
    errors.registration_certificate_file_id = locale.t.agent.errRegCert
  }
  if (form.bank_name.trim() === '') errors.bank_name = locale.t.agent.errBankName
  if (!/^\d{20,26}$/.test(digits(form.bank_account))) errors.bank_account = locale.t.agent.errAccount
  if (!/^\d{5}$/.test(digits(form.mfo))) errors.mfo = locale.t.agent.errMfo
  if (form.phone.trim() === '') errors.phone = locale.t.agent.errPhone
  if (!form.accept_offer) errors.accept_offer = locale.t.agent.offerRequired

  return errors
}

/** Validates the given steps; shows errors, toasts + scrolls to the first one. */
function validateSteps(steps: number[]): boolean {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
  const all = collectErrors()
  const fields = steps.flatMap(n => STEP_FIELDS[n])
  const failed = fields.filter(field => all[field])

  failed.forEach((field) => { fieldErrors[field] = all[field] })
  if (failed.length === 0) return true

  const firstField = failed[0]
  toast.error(`${fieldLabels.value[firstField] ?? firstField}: ${all[firstField]}`)
  document.getElementById(firstField)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  return false
}

const stepTitle = computed(() => [
  '',
  locale.t.agent.company,
  locale.t.agent.director,
  locale.t.agent.registrationBank,
  locale.t.agent.stepReview,
][step.value])

const stepCounter = computed(() => locale.t.agent.stepCounter
  .replace('{current}', String(step.value))
  .replace('{total}', String(TOTAL_STEPS)))

const isLastStep = computed(() => step.value === TOTAL_STEPS)

watch(step, () => window.scrollTo({ top: 0, behavior: 'smooth' }))

function goBack() {
  if (step.value > 1) step.value -= 1
}

function goToStep(n: number) {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
  step.value = n
}

function handleNext() {
  if (!validateSteps([step.value])) return
  if (!isLastStep.value) step.value += 1
}

const uploaded = (fileId: number | null) => (fileId !== null ? locale.t.agent.stepUploaded : '—')

const summary = computed(() => [
  {
    step: 1,
    title: locale.t.agent.company,
    rows: [
      { key: locale.t.agent.companyName, value: form.company_name.trim() || '—' },
      { key: locale.t.agent.legalForm, value: form.legal_form.trim() || '—' },
      { key: locale.t.agent.innLabel, value: digits(form.inn) || '—' },
    ],
  },
  {
    step: 2,
    title: locale.t.agent.director,
    rows: [
      { key: locale.t.agent.fullName, value: form.director_name.trim() || '—' },
      { key: locale.t.agent.passport, value: normalizePassport(form.director_passport) || '—' },
      { key: locale.t.agent.passportScan, value: uploaded(form.director_passport_file_id) },
    ],
  },
  {
    step: 3,
    title: locale.t.agent.registrationBank,
    rows: [
      { key: locale.t.agent.registrationCert, value: uploaded(form.registration_certificate_file_id) },
      { key: locale.t.agent.bankName, value: form.bank_name.trim() || '—' },
      { key: locale.t.agent.accountNumber, value: digits(form.bank_account) || '—' },
      { key: locale.t.agent.mfo, value: digits(form.mfo) || '—' },
      { key: locale.t.agent.contactPhone, value: form.phone.trim() || '—' },
    ],
  },
])

function handleSubmit() {
  if (!isLastStep.value) {
    handleNext()
    return
  }

  // Final gate: any earlier step that is still invalid sends the user back to it.
  const firstBadStep = [1, 2, 3, 4].find(n => STEP_FIELDS[n].some(field => collectErrors()[field]))
  if (firstBadStep === undefined) {
    Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
  }
  else {
    step.value = firstBadStep
    void Promise.resolve().then(() => validateSteps([firstBadStep]))
    return
  }

  emit('submit', {
    company_name: form.company_name.trim(),
    legal_form: form.legal_form.trim(),
    inn: digits(form.inn),
    director_name: form.director_name.trim(),
    director_passport: normalizePassport(form.director_passport),
    director_passport_file_id: form.director_passport_file_id!,
    registration_certificate_file_id: form.registration_certificate_file_id!,
    bank_name: form.bank_name.trim(),
    bank_account: digits(form.bank_account),
    mfo: digits(form.mfo),
    phone: form.phone.trim(),
    accept_offer: true,
  })
}

const inputClass = 'glass-input'
</script>

<template>
  <form
    class="space-y-4 pb-28"
    @submit.prevent="handleSubmit"
  >
    <!-- Stepper -->
    <div class="space-y-3">
      <div
        class="flex gap-1.5"
        aria-hidden="true"
      >
        <span
          v-for="n in TOTAL_STEPS"
          :key="n"
          class="h-1.5 flex-1 rounded-full transition-colors"
          :class="n <= step ? 'bg-primary' : 'bg-border'"
        />
      </div>
      <div>
        <p class="text-xs font-semibold text-muted-foreground">
          {{ stepCounter }}
        </p>
        <h2
          class="text-xl font-extrabold leading-tight"
          style="font-family: var(--rb-font-display)"
        >
          {{ stepTitle }}
        </h2>
      </div>
    </div>

    <!-- Company -->
    <GlassCard
      v-if="step === 1"
      class="space-y-4"
    >
      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="company_name"
        >{{ locale.t.agent.companyName }}</label>
        <input
          id="company_name"
          v-model="form.company_name"
          type="text"
          placeholder="Nova Media Group"
          :class="inputClass"
        >
        <p
          v-if="fieldErrors.company_name"
          class="text-xs text-destructive"
        >
          {{ fieldErrors.company_name }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="legal_form"
        >{{ locale.t.agent.legalForm }}</label>
        <input
          id="legal_form"
          v-model="form.legal_form"
          type="text"
          list="legal-forms"
          placeholder="MChJ"
          :class="inputClass"
        >
        <datalist id="legal-forms">
          <option value="YaTT" />
          <option value="MChJ" />
          <option value="AJ" />
        </datalist>
        <p
          v-if="fieldErrors.legal_form"
          class="text-xs text-destructive"
        >
          {{ fieldErrors.legal_form }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="inn"
        >{{ locale.t.agent.innLabel }}</label>
        <input
          id="inn"
          v-model="form.inn"
          type="text"
          inputmode="numeric"
          maxlength="9"
          placeholder="123456789"
          :class="inputClass"
        >
        <p
          v-if="fieldErrors.inn"
          class="text-xs text-destructive"
        >
          {{ fieldErrors.inn }}
        </p>
      </div>
    </GlassCard>

    <!-- Director -->
    <GlassCard
      v-if="step === 2"
      class="space-y-4"
    >
      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="director_name"
        >{{ locale.t.agent.fullName }}</label>
        <input
          id="director_name"
          v-model="form.director_name"
          type="text"
          placeholder="Akmal Karimov"
          :class="inputClass"
        >
        <p
          v-if="fieldErrors.director_name"
          class="text-xs text-destructive"
        >
          {{ fieldErrors.director_name }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="director_passport"
        >{{ locale.t.agent.passport }}</label>
        <input
          id="director_passport"
          v-model="form.director_passport"
          type="text"
          maxlength="9"
          placeholder="AA1234567"
          :class="cn(inputClass, 'uppercase')"
        >
        <p
          v-if="fieldErrors.director_passport"
          class="text-xs text-destructive"
        >
          {{ fieldErrors.director_passport }}
        </p>
      </div>

      <FileUpload
        v-model="form.director_passport_file_id"
        :label="locale.t.agent.passportScan"
        :hint="locale.t.agent.photoOrPdf"
        :current-name="initial?.director_passport_file ? locale.t.agent.passportScanName : null"
        :invalid="!!fieldErrors.director_passport_file_id"
      />
      <p
        v-if="fieldErrors.director_passport_file_id"
        class="-mt-2 text-xs text-destructive"
      >
        {{ fieldErrors.director_passport_file_id }}
      </p>
    </GlassCard>

    <!-- Registration + bank -->
    <GlassCard
      v-if="step === 3"
      class="space-y-4"
    >
      <FileUpload
        v-model="form.registration_certificate_file_id"
        :label="locale.t.agent.registrationCert"
        :hint="locale.t.agent.photoOrPdf"
        :current-name="initial?.registration_certificate_file ? locale.t.agent.regCertName : null"
        :invalid="!!fieldErrors.registration_certificate_file_id"
      />
      <p
        v-if="fieldErrors.registration_certificate_file_id"
        class="-mt-2 text-xs text-destructive"
      >
        {{ fieldErrors.registration_certificate_file_id }}
      </p>

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="bank_name"
        >{{ locale.t.agent.bankName }}</label>
        <input
          id="bank_name"
          v-model="form.bank_name"
          type="text"
          placeholder="Ipoteka Bank"
          :class="inputClass"
        >
        <p
          v-if="fieldErrors.bank_name"
          class="text-xs text-destructive"
        >
          {{ fieldErrors.bank_name }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="bank_account"
        >{{ locale.t.agent.accountNumber }}</label>
        <input
          id="bank_account"
          v-model="form.bank_account"
          type="text"
          inputmode="numeric"
          maxlength="26"
          placeholder="2020 8000 9001 2345 6789"
          :class="inputClass"
        >
        <p
          v-if="fieldErrors.bank_account"
          class="text-xs text-destructive"
        >
          {{ fieldErrors.bank_account }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="mfo"
        >{{ locale.t.agent.mfo }}</label>
        <input
          id="mfo"
          v-model="form.mfo"
          type="text"
          inputmode="numeric"
          maxlength="5"
          placeholder="00440"
          :class="inputClass"
        >
        <p
          v-if="fieldErrors.mfo"
          class="text-xs text-destructive"
        >
          {{ fieldErrors.mfo }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label
          class="text-sm font-medium"
          for="phone"
        >{{ locale.t.agent.contactPhone }}</label>
        <input
          id="phone"
          v-model="form.phone"
          type="tel"
          inputmode="tel"
          placeholder="+998 90 123 45 67"
          :class="inputClass"
        >
        <p
          v-if="fieldErrors.phone"
          class="text-xs text-destructive"
        >
          {{ fieldErrors.phone }}
        </p>
      </div>
    </GlassCard>

    <!-- Review + offer -->
    <template v-if="step === 4">
      <p class="text-sm leading-relaxed text-muted-foreground">
        {{ locale.t.agent.stepReviewHint }}
      </p>

      <GlassCard
        v-for="section in summary"
        :key="section.step"
        class="space-y-3"
      >
        <div class="flex items-center justify-between">
          <p class="text-base font-bold">
            {{ section.title }}
          </p>
          <button
            type="button"
            class="min-h-11 px-1 text-sm font-semibold text-primary"
            @click="goToStep(section.step)"
          >
            {{ locale.t.agent.stepEdit }}
          </button>
        </div>
        <div
          v-for="row in section.rows"
          :key="row.key"
          class="flex justify-between gap-4 text-sm"
        >
          <span class="text-muted-foreground">{{ row.key }}</span>
          <span class="break-all text-right font-semibold">{{ row.value }}</span>
        </div>
      </GlassCard>

      <AgentOfferConsent
        v-model="form.accept_offer"
        :error="fieldErrors.accept_offer"
      />
    </template>

    <!-- Fixed action bar (replaces the tab bar on this page) -->
    <div class="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
      <div class="mx-auto flex max-w-lg gap-2 px-4 pb-6 pt-3">
        <Button
          v-if="step > 1"
          type="button"
          variant="outline"
          class="h-14 shrink-0 rounded-2xl px-5 text-base"
          :disabled="submitting"
          @click="goBack"
        >
          {{ locale.t.agent.stepBack }}
        </Button>
        <Button
          type="submit"
          class="h-14 flex-1 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
          :disabled="submitting"
        >
          <Loader2
            v-if="submitting"
            class="size-4 animate-spin"
          />
          <template v-if="!isLastStep">
            {{ locale.t.agent.stepNext }}
          </template>
          <template v-else>
            {{ submitting ? locale.t.agent.submitting : initial ? locale.t.agent.resubmit : locale.t.agent.submitVerify }}
          </template>
        </Button>
      </div>
    </div>
  </form>
</template>
