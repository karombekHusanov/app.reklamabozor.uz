<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
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
import TermsConsent from './TermsConsent.vue'

const locale = useLocaleStore()
const onboarding = useOnboardingStore()
const auth = useAuthStore()
const router = useRouter()
const { haptic } = useTelegram()

const agreed = ref(false)
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
  if (!agreed.value || submitting.value) return
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
    // Finishes onboarding (stamps role_selected_at); everyone starts as a
    // client and drops into the app.
    await onboarding.selectPersonType(personType)
    await router.replace(ROUTES.home)
  }
  catch (e) {
    errorMessage.value = getApiErrorMessage(e) || locale.t.onboarding.personType.error
    submitting.value = false
  }
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
        class="mt-12 flex flex-1 flex-col"
      >
        <h2 class="text-center text-lg font-bold text-foreground">
          {{ locale.t.onboarding.terms.title }}
        </h2>
        <p class="mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          {{ locale.t.onboarding.terms.body }}
        </p>

        <div class="flex flex-1 items-center py-8">
          <TermsConsent v-model="agreed" />
        </div>

        <p
          v-if="errorMessage"
          class="mb-4 rounded-2xl bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
        >
          {{ errorMessage }}
        </p>

        <div class="pt-2">
          <button
            type="button"
            class="btn-brand mx-auto flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-2xl text-base font-semibold"
            :disabled="!agreed || submitting"
            @click="confirmTerms"
          >
            {{ locale.t.common.next }}
            <ArrowRight class="size-5" />
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
