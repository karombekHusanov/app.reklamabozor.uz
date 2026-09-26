<script setup lang="ts">
import { Check, Loader2 } from '@lucide/vue'
import { ref } from 'vue'
import Drawer from '@/core/ui/Drawer.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import PublicOfferDocument from '@/modules/legal/components/PublicOfferDocument.vue'

/**
 * The agency partnership offer in a drawer; the accept button sits at the end
 * of the text, so accepting means scrolling through it.
 */
defineProps<{
  submitting?: boolean
}>()

const emit = defineEmits<{ accept: [] }>()

const open = defineModel<boolean>('open', { default: false })

const locale = useLocaleStore()
const loaded = ref(false)
</script>

<template>
  <Drawer
    v-model:open="open"
    :title="locale.t.legal.agentOfferTitle"
  >
    <PublicOfferDocument
      kind="agent"
      @loaded="loaded = true"
    />

    <Button
      v-if="loaded"
      type="button"
      class="btn-brand mt-6 h-12 w-full rounded-2xl text-base font-semibold"
      :disabled="submitting"
      @click="emit('accept')"
    >
      <Loader2
        v-if="submitting"
        class="size-4 animate-spin"
      />
      <Check
        v-else
        class="size-4"
      />
      {{ locale.t.agent.offerAccept }}
    </Button>
  </Drawer>
</template>
