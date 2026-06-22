<script setup lang="ts">
import { FileText, Loader2, Send } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Badge from '@/core/ui/Badge.vue'
import { Button } from '@/core/ui/button'
import { cn } from '@/core/lib/utils'
import { formatPrice, offerStatusLabel, offerStatusVariant } from '@/modules/orders/lib/order-status'
import type { AgentOrder, CreateOfferPayload } from '@/modules/orders/types/order'

const props = defineProps<{
  order: AgentOrder
  submitting?: boolean
  /** Deep-link focus — highlight and open the offer form by default. */
  highlight?: boolean
}>()

const emit = defineEmits<{
  submit: [orderId: number, payload: CreateOfferPayload]
}>()

// Auto-open the offer form when deep-linked (and not already offered).
const showForm = ref(Boolean(props.highlight) && !props.order.my_offer)
const form = reactive({ price: '', comment: '' })

const canSubmit = computed(() =>
  Number(form.price) > 0 && form.comment.trim() !== '',
)

function send() {
  if (!canSubmit.value) return
  emit('submit', props.order.id, {
    price: Number(form.price),
    comment: form.comment.trim(),
  })
  showForm.value = false
}

const inputClass = 'glass-input'
</script>

<template>
  <GlassCard
    :id="`agent-order-${order.id}`"
    class="space-y-3 scroll-mt-20 transition-shadow"
    :class="highlight && 'ring-2 ring-primary/50'"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate font-semibold leading-tight">
          {{ order.category?.name_uz ?? order.title }}
        </p>
        <p v-if="order.client.first_name" class="text-xs text-muted-foreground">
          from {{ order.client.first_name }}
        </p>
      </div>
      <Badge v-if="order.my_offer" :variant="offerStatusVariant(order.my_offer.status)" class="shrink-0">
        {{ offerStatusLabel(order.my_offer.status) }}
      </Badge>
    </div>

    <p class="line-clamp-3 text-sm text-muted-foreground">
      {{ order.description }}
    </p>

    <a
      v-if="order.tz_file"
      :href="order.tz_file"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-2 text-sm font-medium text-primary"
    >
      <FileText class="size-4" />
      View brief (TZ)
    </a>

    <!-- Already offered -->
    <div
      v-if="order.my_offer"
      class="rounded-2xl bg-black/5 px-4 py-3 text-sm dark:bg-white/5"
    >
      <span class="text-muted-foreground">Your offer:</span>
      <span class="ml-1 font-semibold text-primary">{{ formatPrice(order.my_offer.price) }}</span>
    </div>

    <!-- Offer form -->
    <template v-else>
      <div v-if="showForm" class="space-y-2.5">
        <input v-model="form.price" type="number" inputmode="numeric" min="0" placeholder="Price (so‘m)" :class="inputClass">
        <textarea v-model="form.comment" rows="2" placeholder="Your pitch / what's included…" :class="cn(inputClass, 'resize-none')" />
        <div class="flex gap-2">
          <Button class="h-10 flex-1 rounded-2xl" :disabled="!canSubmit || submitting" @click="send">
            <Loader2 v-if="submitting" class="size-4 animate-spin" />
            <Send v-else class="size-4" />
            Send offer
          </Button>
          <Button variant="outline" class="h-10 rounded-2xl" @click="showForm = false">
            Cancel
          </Button>
        </div>
      </div>
      <Button v-else variant="outline" class="h-10 w-full rounded-2xl" @click="showForm = true">
        <Send class="size-4" />
        Send an offer
      </Button>
    </template>
  </GlassCard>
</template>
