<script setup lang="ts">
import { Loader2, Send } from '@lucide/vue'
import { ref } from 'vue'
import Drawer from '@/core/ui/Drawer.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'

const props = defineProps<{
  orderId: number
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [price: number, comment: string]
}>()

const open = defineModel<boolean>('open', { default: false })

const locale = useLocaleStore()

const price = ref('')
const comment = ref('')
const errors = ref<{ price?: string, comment?: string }>({})

function validate(): boolean {
  errors.value = {}
  const numPrice = Number(price.value)
  if (!price.value || Number.isNaN(numPrice) || numPrice <= 0) {
    errors.value.price = locale.t.orders.showcase.errPrice
  }
  if (!comment.value.trim()) {
    errors.value.comment = locale.t.orders.showcase.errComment
  }
  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate() || props.submitting) return
  emit('submit', Number(price.value), comment.value.trim())
}

function reset() {
  price.value = ''
  comment.value = ''
  errors.value = {}
}

defineExpose({ reset })
</script>

<template>
  <Drawer
    v-model:open="open"
    :title="locale.t.orders.showcase.makeOffer"
  >
    <form
      class="space-y-4 pb-2"
      @submit.prevent="handleSubmit"
    >
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-muted-foreground">
          {{ locale.t.orders.showcase.offerPrice }}
        </label>
        <input
          v-model="price"
          type="number"
          inputmode="numeric"
          min="1"
          class="glass-input"
          :placeholder="locale.t.orders.showcase.offerPricePlaceholder"
        >
        <p
          v-if="errors.price"
          class="text-xs text-destructive"
        >
          {{ errors.price }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-muted-foreground">
          {{ locale.t.orders.showcase.offerComment }}
        </label>
        <textarea
          v-model="comment"
          rows="3"
          class="glass-input resize-y"
          :placeholder="locale.t.orders.showcase.offerCommentPlaceholder"
        />
        <p
          v-if="errors.comment"
          class="text-xs text-destructive"
        >
          {{ errors.comment }}
        </p>
      </div>

      <Button
        type="submit"
        class="h-12 w-full rounded-2xl text-base"
        :disabled="submitting"
      >
        <Loader2
          v-if="submitting"
          class="size-4 animate-spin"
        />
        <Send
          v-else
          class="size-4"
        />
        {{ submitting ? locale.t.orders.showcase.submitting : locale.t.orders.showcase.submitOffer }}
      </Button>
    </form>
  </Drawer>
</template>
