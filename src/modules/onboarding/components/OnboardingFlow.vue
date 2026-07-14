<script setup lang="ts">
import { ArrowRight, Check } from '@lucide/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandLogo from '@/core/ui/BrandLogo.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { LOCALES, type Locale } from '@/core/i18n/messages'
import { useTelegram } from '@/core/composables/useTelegram'
import { getApiErrorMessage } from '@/core/api/api-error'
import { ROUTES } from '@/modules/shell/constants/routes'
import { useOnboardingStore } from '@/modules/onboarding/stores/onboarding.store'
import type { SelectableRole } from '@/modules/auth/types/user'

const locale = useLocaleStore()
const onboarding = useOnboardingStore()
const router = useRouter()
const { haptic } = useTelegram()

const agreed = ref(false)
const submitting = ref(false)
const errorMessage = ref<string | null>(null)

const roleOptions: { role: SelectableRole, key: 'client' | 'agent' | 'designer' | 'seller' }[] = [
  { role: 'client', key: 'client' },
  { role: 'agent', key: 'agent' },
  { role: 'designer', key: 'designer' },
  { role: 'seller', key: 'seller' },
]

function pickLanguage(value: Locale) {
  haptic('light')
  locale.setLocale(value)
  onboarding.goTo('terms')
}

function confirmTerms() {
  if (!agreed.value) return
  haptic('light')
  onboarding.acceptTerms()
}

async function pickRole(role: SelectableRole) {
  if (submitting.value) return
  submitting.value = true
  errorMessage.value = null
  haptic('medium')

  try {
    await onboarding.selectRole(role)
    // Providers land on profile after role selection.
    if (role !== 'client') {
      await router.replace(ROUTES.profile)
    }
  }
  catch (e) {
    errorMessage.value = getApiErrorMessage(e) || locale.t.onboarding.role.error
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
      <div v-if="onboarding.step === 'language'" class="mt-16 flex flex-1 flex-col">
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
      <div v-else-if="onboarding.step === 'terms'" class="mt-12 flex flex-1 flex-col">
        <h2 class="text-center text-lg font-bold text-foreground">
          {{ locale.t.onboarding.terms.title }}
        </h2>
        <p class="mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          {{ locale.t.onboarding.terms.body }}
        </p>

        <button
          type="button"
          class="mx-auto mt-8 flex items-center gap-2.5"
          @click="agreed = !agreed"
        >
          <span
            class="flex size-5 items-center justify-center rounded-md border transition"
            :class="agreed ? 'border-primary bg-primary text-white' : 'border-border bg-card'"
          >
            <Check v-if="agreed" class="size-3.5" />
          </span>
          <span class="text-sm font-medium text-foreground">{{ locale.t.onboarding.terms.agree }}</span>
        </button>

        <div class="mt-auto pt-10">
          <button
            type="button"
            class="btn-brand mx-auto flex h-14 w-full max-w-xs items-center justify-center rounded-2xl"
            :disabled="!agreed"
            @click="confirmTerms"
          >
            <ArrowRight class="size-5" />
          </button>
        </div>
      </div>

      <!-- ============ ROLE ============ -->
      <div v-else class="mt-12 flex flex-1 flex-col">
        <p class="text-center text-sm text-muted-foreground">
          {{ locale.t.onboarding.role.title }}
        </p>

        <div class="mt-8 space-y-3">
          <button
            v-for="option in roleOptions"
            :key="option.role"
            type="button"
            class="btn-brand h-14 w-full rounded-2xl text-base font-semibold"
            :disabled="submitting"
            @click="pickRole(option.role)"
          >
            {{ locale.t.roles[option.key] }}
          </button>
        </div>

        <p v-if="submitting" class="mt-4 text-center text-sm text-muted-foreground">
          {{ locale.t.onboarding.role.saving }}
        </p>
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
