<script setup lang="ts">
import { ref } from 'vue'
import BrandLogo from '@/core/ui/BrandLogo.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { getApiErrorMessage } from '@/core/api/api-error'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import TermsReview from './TermsReview.vue'

const locale = useLocaleStore()
const auth = useAuthStore()
const { haptic } = useTelegram()

const submitting = ref(false)
const errorMessage = ref<string | null>(null)

async function confirm() {
  if (submitting.value) return
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

      <div class="mt-10 flex flex-1 flex-col">
        <h2 class="text-center text-lg font-bold text-foreground">
          {{ locale.t.onboarding.terms.updatedTitle }}
        </h2>
        <p class="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          {{ locale.t.onboarding.terms.updatedBody }}
        </p>

        <div class="mt-6">
          <TermsReview
            :submitting="submitting"
            :error="errorMessage"
            @confirm="confirm"
          />
        </div>
      </div>
    </div>
  </div>
</template>
