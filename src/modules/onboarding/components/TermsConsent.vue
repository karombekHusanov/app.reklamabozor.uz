<script setup lang="ts">
import { ref } from 'vue'
import { Checkbox } from '@/core/ui/checkbox'
import { Label } from '@/core/ui/label'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import PublicOfferOverlay from '@/modules/legal/components/PublicOfferOverlay.vue'

const agreed = defineModel<boolean>({ default: false })

const locale = useLocaleStore()
const showOffer = ref(false)

function onAgree(value: boolean | 'indeterminate') {
  agreed.value = value === true
}

function openOffer(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  showOffer.value = true
}
</script>

<template>
  <div class="w-full">
    <p class="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {{ locale.t.onboarding.terms.consentLabel }}
    </p>

    <GlassCard
      padding="sm"
      class="bg-white dark:bg-card"
    >
      <div class="flex items-start gap-3">
        <Checkbox
          id="terms-agree"
          class="mt-0.5"
          :model-value="agreed"
          @update:model-value="onAgree"
        />
        <Label
          for="terms-agree"
          class="block min-w-0 flex-1 cursor-pointer text-sm font-medium leading-snug text-foreground"
        >
          {{ locale.t.onboarding.terms.agreeBefore }}
          <button
            type="button"
            class="text-primary underline underline-offset-2"
            @click="openOffer"
          >
            {{ locale.t.onboarding.terms.agreeLink }}
          </button>
          {{ locale.t.onboarding.terms.agreeAfter }}
        </Label>
      </div>
    </GlassCard>
  </div>

  <PublicOfferOverlay
    v-if="showOffer"
    @close="showOffer = false"
  />
</template>
