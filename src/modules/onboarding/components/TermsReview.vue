<script setup lang="ts">
import { Check, ChevronRight, FileText } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { Checkbox } from '@/core/ui/checkbox'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import { useOnboardingStore } from '@/modules/onboarding/stores/onboarding.store'

/**
 * Terms step: just the «I have read it» checkbox and the accept button. The offer
 * itself lives on its own page — whoever is curious opens it from here and comes back.
 */
defineProps<{
  submitting: boolean
  error: string | null
}>()

const emit = defineEmits<{
  confirm: []
}>()

const locale = useLocaleStore()
const onboarding = useOnboardingStore()
const router = useRouter()
const { haptic } = useTelegram()

function openOffer() {
  haptic('light')
  void router.push(ROUTES.publicOffer)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Read it first, if curious -->
    <button
      type="button"
      class="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-card px-4 text-left shadow-sm transition active:scale-[0.99]"
      @click="openOffer"
    >
      <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <FileText class="size-[18px]" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-[14.5px] font-medium text-foreground">{{ locale.t.onboarding.terms.readLink }}</span>
        <span class="block text-xs text-muted-foreground">{{ locale.t.onboarding.terms.readLinkHint }}</span>
      </span>
      <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
    </button>

    <!-- «Tanishdim» -->
    <label class="flex cursor-pointer items-start gap-3 rounded-2xl bg-card p-4 shadow-sm">
      <Checkbox
        v-model="onboarding.offerChecked"
        class="mt-0.5 size-5 rounded-md"
      />
      <span class="text-[14px] leading-snug text-foreground">{{ locale.t.onboarding.terms.checkbox }}</span>
    </label>

    <p
      v-if="error"
      class="rounded-2xl bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
    >
      {{ error }}
    </p>

    <button
      type="button"
      class="btn-brand mx-auto mt-2 flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-2xl text-base font-semibold disabled:opacity-50"
      :disabled="submitting || !onboarding.offerChecked"
      @click="emit('confirm')"
    >
      <Check class="size-5" />
      {{ locale.t.onboarding.terms.accept }}
    </button>
  </div>
</template>
