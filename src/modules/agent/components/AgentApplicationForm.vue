<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import { reactive } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import FileUpload from '@/core/ui/FileUpload.vue'
import StickyActionBar from '@/core/ui/StickyActionBar.vue'
import { Button } from '@/core/ui/button'
import { cn } from '@/core/lib/utils'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type {
  AgentApplicationPayload,
  AgentProfile,
} from '@/modules/agent/types/agent'

const locale = useLocaleStore()

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
})

const fieldErrors = reactive<Record<string, string>>({})

// Normalize user formatting (spaces, dashes) before validating numeric / passport fields.
const digits = (value: string) => value.replace(/\D/g, '')
const normalizePassport = (value: string) => value.replace(/\s/g, '').toUpperCase()

function validate(): boolean {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])

  if (form.company_name.trim() === '') fieldErrors.company_name = locale.t.agent.errCompanyName
  if (form.legal_form.trim() === '') fieldErrors.legal_form = locale.t.agent.errLegalForm
  if (!/^\d{9}$/.test(digits(form.inn))) fieldErrors.inn = locale.t.agent.errInn
  if (form.director_name.trim() === '') fieldErrors.director_name = locale.t.agent.errDirectorName
  if (!/^[A-Z]{2}\d{7}$/.test(normalizePassport(form.director_passport))) {
    fieldErrors.director_passport = locale.t.agent.errPassport
  }
  if (form.director_passport_file_id === null) fieldErrors.director_passport_file_id = locale.t.agent.errPassportScan
  if (form.registration_certificate_file_id === null) {
    fieldErrors.registration_certificate_file_id = locale.t.agent.errRegCert
  }
  if (form.bank_name.trim() === '') fieldErrors.bank_name = locale.t.agent.errBankName
  if (!/^\d{20,26}$/.test(digits(form.bank_account))) fieldErrors.bank_account = locale.t.agent.errAccount
  if (!/^\d{5}$/.test(digits(form.mfo))) fieldErrors.mfo = locale.t.agent.errMfo
  if (form.phone.trim() === '') fieldErrors.phone = locale.t.agent.errPhone

  return Object.keys(fieldErrors).length === 0
}

function handleSubmit() {
  if (!validate()) return

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
  })
}

const inputClass = 'glass-input'
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Company -->
    <GlassCard class="space-y-4">
      <p class="text-sm font-semibold">
        {{ locale.t.agent.company }}
      </p>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="company_name">{{ locale.t.agent.companyName }}</label>
        <input id="company_name" v-model="form.company_name" type="text" placeholder="Nova Media Group" :class="inputClass">
        <p v-if="fieldErrors.company_name" class="text-xs text-destructive">{{ fieldErrors.company_name }}</p>
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="legal_form">{{ locale.t.agent.legalForm }}</label>
        <input id="legal_form" v-model="form.legal_form" type="text" list="legal-forms" placeholder="MChJ" :class="inputClass">
        <datalist id="legal-forms">
          <option value="YaTT" />
          <option value="MChJ" />
          <option value="AJ" />
        </datalist>
        <p v-if="fieldErrors.legal_form" class="text-xs text-destructive">{{ fieldErrors.legal_form }}</p>
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="inn">{{ locale.t.agent.innLabel }}</label>
        <input id="inn" v-model="form.inn" type="text" inputmode="numeric" maxlength="9" placeholder="123456789" :class="inputClass">
        <p v-if="fieldErrors.inn" class="text-xs text-destructive">{{ fieldErrors.inn }}</p>
      </div>
    </GlassCard>

    <!-- Director -->
    <GlassCard class="space-y-4">
      <p class="text-sm font-semibold">
        {{ locale.t.agent.director }}
      </p>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="director_name">{{ locale.t.agent.fullName }}</label>
        <input id="director_name" v-model="form.director_name" type="text" placeholder="Akmal Karimov" :class="inputClass">
        <p v-if="fieldErrors.director_name" class="text-xs text-destructive">{{ fieldErrors.director_name }}</p>
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="director_passport">{{ locale.t.agent.passport }}</label>
        <input id="director_passport" v-model="form.director_passport" type="text" maxlength="9" placeholder="AA1234567" :class="cn(inputClass, 'uppercase')">
        <p v-if="fieldErrors.director_passport" class="text-xs text-destructive">{{ fieldErrors.director_passport }}</p>
      </div>

      <FileUpload
        v-model="form.director_passport_file_id"
        :label="locale.t.agent.passportScan"
        :hint="locale.t.agent.photoOrPdf"
        :current-name="initial?.director_passport_file ? locale.t.agent.passportScanName : null"
        :invalid="!!fieldErrors.director_passport_file_id"
      />
      <p v-if="fieldErrors.director_passport_file_id" class="-mt-2 text-xs text-destructive">
        {{ fieldErrors.director_passport_file_id }}
      </p>
    </GlassCard>

    <!-- Registration + bank -->
    <GlassCard class="space-y-4">
      <p class="text-sm font-semibold">
        {{ locale.t.agent.registrationBank }}
      </p>

      <FileUpload
        v-model="form.registration_certificate_file_id"
        :label="locale.t.agent.registrationCert"
        :hint="locale.t.agent.photoOrPdf"
        :current-name="initial?.registration_certificate_file ? locale.t.agent.regCertName : null"
        :invalid="!!fieldErrors.registration_certificate_file_id"
      />
      <p v-if="fieldErrors.registration_certificate_file_id" class="-mt-2 text-xs text-destructive">
        {{ fieldErrors.registration_certificate_file_id }}
      </p>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="bank_name">{{ locale.t.agent.bankName }}</label>
        <input id="bank_name" v-model="form.bank_name" type="text" placeholder="Ipoteka Bank" :class="inputClass">
        <p v-if="fieldErrors.bank_name" class="text-xs text-destructive">{{ fieldErrors.bank_name }}</p>
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="bank_account">{{ locale.t.agent.accountNumber }}</label>
        <input id="bank_account" v-model="form.bank_account" type="text" inputmode="numeric" maxlength="26" placeholder="2020 8000 9001 2345 6789" :class="inputClass">
        <p v-if="fieldErrors.bank_account" class="text-xs text-destructive">{{ fieldErrors.bank_account }}</p>
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="mfo">{{ locale.t.agent.mfo }}</label>
        <input id="mfo" v-model="form.mfo" type="text" inputmode="numeric" maxlength="5" placeholder="00440" :class="inputClass">
        <p v-if="fieldErrors.mfo" class="text-xs text-destructive">{{ fieldErrors.mfo }}</p>
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="phone">{{ locale.t.agent.contactPhone }}</label>
        <input id="phone" v-model="form.phone" type="tel" inputmode="tel" placeholder="+998 90 123 45 67" :class="inputClass">
        <p v-if="fieldErrors.phone" class="text-xs text-destructive">{{ fieldErrors.phone }}</p>
      </div>
    </GlassCard>

    <StickyActionBar>
      <Button type="submit" class="h-12 w-full rounded-2xl text-base shadow-lg shadow-primary/20" :disabled="submitting">
        <Loader2 v-if="submitting" class="size-4 animate-spin" />
        {{ submitting ? locale.t.agent.submitting : initial ? locale.t.agent.resubmit : locale.t.agent.submitVerify }}
      </Button>
    </StickyActionBar>
  </form>
</template>
