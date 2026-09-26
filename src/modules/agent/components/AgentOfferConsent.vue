<script setup lang="ts">
import { FileText } from '@lucide/vue'
import { ref } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { Checkbox } from '@/core/ui/checkbox'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AgentOfferDrawer from './AgentOfferDrawer.vue'

/** Click-wrap consent to the agency partnership offer inside the KYC form. */
defineProps<{
  error?: string | null
}>()

const accepted = defineModel<boolean>({ default: false })

const locale = useLocaleStore()
const drawerOpen = ref(false)

function acceptFromDrawer() {
  accepted.value = true
  drawerOpen.value = false
}
</script>

<template>
  <GlassCard
    id="accept_offer"
    class="space-y-3"
  >
    <p class="text-sm font-semibold">
      {{ locale.t.agent.offerTitle }}
    </p>
    <p class="text-xs leading-relaxed text-muted-foreground">
      {{ locale.t.agent.offerBody }}
    </p>

    <button
      type="button"
      class="pressable flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary"
      @click="drawerOpen = true"
    >
      <FileText class="size-4" />
      {{ locale.t.agent.offerRead }}
    </button>

    <label class="flex min-h-11 cursor-pointer items-start gap-3">
      <Checkbox
        v-model="accepted"
        class="mt-0.5"
        :aria-invalid="!!error"
      />
      <span class="text-[13px] font-medium leading-snug text-foreground">
        {{ locale.t.agent.offerCheckbox }}
      </span>
    </label>

    <p
      v-if="error"
      class="text-xs text-destructive"
    >
      {{ error }}
    </p>

    <AgentOfferDrawer
      v-model:open="drawerOpen"
      @accept="acceptFromDrawer"
    />
  </GlassCard>
</template>
