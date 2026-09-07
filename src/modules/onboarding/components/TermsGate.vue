<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import { ref } from 'vue'
import BrandLogo from '@/core/ui/BrandLogo.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { getApiErrorMessage } from '@/core/api/api-error'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import TermsConsent from './TermsConsent.vue'

const locale = useLocaleStore()
const auth = useAuthStore()
const { haptic } = useTelegram()

const agreed = ref(false)
const submitting = ref(false)
const errorMessage = ref<string | null>(null)

async function confirm() {
  if (!agreed.value || submitting.value) return
  submitting.value = true
  errorMessage.value = null
  haptic('light')

  try {
    await auth.acceptTerms()
  }
  catch (e) {
    errorMessage.value = getApiErrorMessage(e) || locale.t.onboarding.personType.error
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="tahoe-bg fixed inset-0 z-[90] flex flex-col overflow-y-auto">
    <div class="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-16">
      <div class="flex justify-center">
        <BrandLogo size="lg" />
      </div>

      <div class="mt-12 flex flex-1 flex-col">
        <h2 class="text-center text-lg font-bold text-foreground">
          {{ locale.t.onboarding.terms.updatedTitle }}
        </h2>
        <p class="mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          {{ locale.t.onboarding.terms.updatedBody }}
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
            @click="confirm"
          >
            {{ locale.t.common.next }}
            <ArrowRight class="size-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
