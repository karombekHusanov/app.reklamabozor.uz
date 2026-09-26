<script setup lang="ts">
import { ArrowDown, Check } from '@lucide/vue'
import { ref } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import PublicOfferDocument from '@/modules/legal/components/PublicOfferDocument.vue'

/**
 * The full public offer followed by the accept button — it lives only at the
 * end of the document, so accepting means scrolling through the text.
 */
defineProps<{
  submitting: boolean
  error: string | null
}>()

const emit = defineEmits<{
  confirm: []
}>()

const locale = useLocaleStore()
const loaded = ref(false)
</script>

<template>
  <div class="flex flex-col">
    <p class="mb-5 flex items-center justify-center gap-1.5 text-center text-xs font-medium text-muted-foreground">
      <ArrowDown class="size-3.5" />
      {{ locale.t.onboarding.terms.readHint }}
    </p>

    <PublicOfferDocument @loaded="loaded = true" />

    <div
      v-if="loaded"
      class="mt-8 space-y-3"
    >
      <p class="text-center text-xs leading-relaxed text-muted-foreground">
        {{ locale.t.onboarding.terms.agree }}
      </p>

      <p
        v-if="error"
        class="rounded-2xl bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
      >
        {{ error }}
      </p>

      <button
        type="button"
        class="btn-brand mx-auto flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-2xl text-base font-semibold"
        :disabled="submitting"
        @click="emit('confirm')"
      >
        <Check class="size-5" />
        {{ locale.t.onboarding.terms.accept }}
      </button>
    </div>
  </div>
</template>
