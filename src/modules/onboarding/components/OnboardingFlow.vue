<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandLogo from '@/core/ui/BrandLogo.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { LOCALES, type Locale } from '@/core/i18n/messages'
import { useTelegram } from '@/core/composables/useTelegram'
import { getApiErrorMessage } from '@/core/api/api-error'
import { ROUTES } from '@/modules/shell/constants/routes'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useOnboardingStore } from '@/modules/onboarding/stores/onboarding.store'
import type { PersonType } from '@/modules/auth/types/user'
import { Building2, ChevronRight, UserRound } from '@lucide/vue'
import TermsReview from './TermsReview.vue'

const locale = useLocaleStore()
const onboarding = useOnboardingStore()
const auth = useAuthStore()
const router = useRouter()
const { haptic } = useTelegram()

const submitting = ref(false)
const errorMessage = ref<string | null>(null)

function pickLanguage(value: Locale) {
  haptic('light')
  locale.setLocale(value)
  // Someone who already accepted the current offer (e.g. left the app before
  // finishing) shouldn't have to re-accept it every launch.
  onboarding.goTo(auth.user?.needs_terms === false ? 'person_type' : 'terms')
}

async function confirmTerms() {
  if (submitting.value) return
  submitting.value = true
  errorMessage.value = null
  haptic('light')

  try {
    await onboarding.acceptTerms()
  }
  catch (e) {
    errorMessage.value = getApiErrorMessage(e) || locale.t.onboarding.personType.error
  }
  finally {
    submitting.value = false
  }
}

async function pickPersonType(personType: PersonType) {
  if (submitting.value) return
  submitting.value = true
  errorMessage.value = null
  haptic('medium')

  try {
    // Stamps role_selected_at; the flow stays open for the intent step.
    await onboarding.selectPersonType(personType)
  }
  catch (e) {
    errorMessage.value = getApiErrorMessage(e) || locale.t.onboarding.personType.error
  }
  finally {
    submitting.value = false
  }
}

/** Last step, front-end only: continue as a client or open the agency KYC form. */
async function pickIntent(intent: 'client' | 'agent') {
  if (submitting.value) return
  submitting.value = true
  haptic('medium')

  onboarding.complete()

  await router.replace(intent === 'agent'
    ? { path: ROUTES.profileEdit, query: { as: 'agent', from: 'onboarding' } }
    : ROUTES.home)
  submitting.value = false
}

</script>

<template>
  <div class="tahoe-bg fixed inset-0 z-[90] flex flex-col overflow-y-auto">
    <div class="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-16">
      <!-- Brand -->
      <div class="flex justify-center">
        <BrandLogo size="lg" />
      </div>

      <!-- ============ LANGUAGE ============ -->
      <div
        v-if="onboarding.step === 'language'"
        class="mt-16 flex flex-1 flex-col"
      >
        <div class="space-y-3">
          <button
            v-for="lang in LOCALES"
            :key="lang.value"
            type="button"
            class="btn-brand h-14 w-full rounded-2xl text-base font-semibold"
            @click="pickLanguage(lang.value)"
          >
            {{ lang.label }}
          </button>
        </div>
      </div>

      <!-- ============ TERMS ============ -->
      <div
        v-else-if="onboarding.step === 'terms'"
        class="mt-10 flex flex-1 flex-col"
      >
        <h2 class="text-center text-lg font-bold text-foreground">
          {{ locale.t.onboarding.terms.title }}
        </h2>
        <p class="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          {{ locale.t.onboarding.terms.body }}
        </p>

        <div class="mt-6">
          <TermsReview
            :submitting="submitting"
            :error="errorMessage"
            @confirm="confirmTerms"
          />
        </div>
      </div>

      <!-- ============ INTENT (client / agency) ============ -->
      <div
        v-else-if="onboarding.step === 'intent'"
        class="mt-12 flex flex-1 flex-col"
      >
        <h2 class="text-center text-lg font-bold text-foreground">
          {{ locale.t.onboarding.intent.title }}
        </h2>
        <p class="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          {{ locale.t.onboarding.intent.body }}
        </p>

        <div class="mt-8 space-y-3">
          <button
            v-for="option in ([
              { key: 'client', icon: UserRound, label: locale.t.onboarding.intent.client, hint: locale.t.onboarding.intent.clientHint },
              { key: 'agent', icon: Building2, label: locale.t.onboarding.intent.agent, hint: locale.t.onboarding.intent.agentHint },
            ] as const)"
            :key="option.key"
            type="button"
            class="glass-input flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left"
            :disabled="submitting"
            @click="pickIntent(option.key)"
          >
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <component
                :is="option.icon"
                class="size-5"
              />
            </span>
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="text-sm font-semibold text-foreground">{{ option.label }}</span>
              <span class="text-[12px] text-muted-foreground">{{ option.hint }}</span>
            </span>
            <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </div>

      <!-- ============ PERSON TYPE ============ -->
      <div
        v-else
        class="mt-12 flex flex-1 flex-col"
      >
        <h2 class="text-center text-lg font-bold text-foreground">
          {{ locale.t.onboarding.personType.title }}
        </h2>
        <p class="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          {{ locale.t.onboarding.personType.body }}
        </p>

        <div class="mt-8 space-y-3">
          <button
            type="button"
            class="glass-input flex w-full flex-col items-start gap-0.5 rounded-2xl px-4 py-3.5 text-left"
            :disabled="submitting"
            @click="pickPersonType('individual')"
          >
            <span class="text-sm font-semibold text-foreground">{{ locale.t.onboarding.personType.individual }}</span>
            <span class="text-[12px] text-muted-foreground">{{ locale.t.onboarding.personType.individualHint }}</span>
          </button>

          <button
            type="button"
            class="glass-input flex w-full flex-col items-start gap-0.5 rounded-2xl px-4 py-3.5 text-left"
            :disabled="submitting"
            @click="pickPersonType('legal_entity')"
          >
            <span class="text-sm font-semibold text-foreground">{{ locale.t.onboarding.personType.legalEntity }}</span>
            <span class="text-[12px] text-muted-foreground">{{ locale.t.onboarding.personType.legalEntityHint }}</span>
          </button>
        </div>

        <p
          v-if="errorMessage"
          class="mt-4 rounded-2xl bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
        >
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>
