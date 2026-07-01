<script setup lang="ts">
import { Clock, Eye, FileText, Loader2, MessageSquareQuote, Send } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Badge from '@/core/ui/Badge.vue'
import { Button } from '@/core/ui/button'
import { cn } from '@/core/lib/utils'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { formatPrice, offerStatusVariant } from '@/modules/orders/lib/order-status'
import type { AgentOrder, CreateOfferPayload } from '@/modules/orders/types/order'

const locale = useLocaleStore()

const props = defineProps<{
  order: AgentOrder
  submitting?: boolean
  /** Deep-link focus — highlight and open the offer form by default. */
  highlight?: boolean
}>()

const deadlineLabel = computed(() => {
  if (props.order.deadline === 'this_week') return locale.t.orders.deadlineThisWeek
  if (props.order.deadline === 'today_tomorrow') return locale.t.orders.deadlineTodayTomorrow
  return null
})

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
          {{ order.category ? categoryName(order.category, locale.locale) : order.title }}
        </p>
        <p v-if="order.client.first_name" class="text-xs text-muted-foreground">
          {{ locale.t.agent.fromLabel }}: {{ order.client.first_name }}
        </p>
      </div>
      <Badge v-if="order.my_offer" :variant="offerStatusVariant(order.my_offer.status)" class="shrink-0">
        {{ locale.t.orders.offerStatus[order.my_offer.status] }}
      </Badge>
    </div>

    <p class="line-clamp-3 text-sm text-muted-foreground">
      {{ order.description }}
    </p>

    <div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span v-if="deadlineLabel" class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
        <Clock class="size-3.5" />
        {{ deadlineLabel }}
      </span>
      <span class="inline-flex items-center gap-1.5">
        <Eye class="size-3.5" />
        {{ order.views_count ?? 0 }} {{ locale.t.orders.viewsSuffix }}
      </span>
      <span class="inline-flex items-center gap-1.5">
        <MessageSquareQuote class="size-3.5" />
        {{ order.offers_count ?? 0 }} {{ locale.t.orders.offersSuffix }}
      </span>
    </div>

    <a
      v-if="order.tz_file"
      :href="order.tz_file"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-2 text-sm font-medium text-primary"
    >
      <FileText class="size-4" />
      {{ locale.t.orders.viewBrief }}
    </a>

    <!-- Already offered -->
    <div
      v-if="order.my_offer"
      class="rounded-2xl bg-muted px-4 py-3 text-sm dark:bg-white/5"
    >
      <span class="text-muted-foreground">{{ locale.t.agent.yourOffer }}</span>
      <span class="ml-1 font-semibold text-primary">{{ formatPrice(order.my_offer.price) }}</span>
    </div>

    <!-- Offer form -->
    <template v-else>
      <div v-if="showForm" class="space-y-2.5">
        <input v-model="form.price" type="number" inputmode="numeric" min="0" :placeholder="locale.t.agent.pricePlaceholder" :class="inputClass">
        <textarea v-model="form.comment" rows="2" :placeholder="locale.t.agent.pitchPlaceholder" :class="cn(inputClass, 'resize-none')" />
        <div class="flex gap-2">
          <Button class="h-10 flex-1 rounded-2xl" :disabled="!canSubmit || submitting" @click="send">
            <Loader2 v-if="submitting" class="size-4 animate-spin" />
            <Send v-else class="size-4" />
            {{ locale.t.agent.sendOffer }}
          </Button>
          <Button variant="outline" class="h-10 rounded-2xl" @click="showForm = false">
            {{ locale.t.agent.cancel }}
          </Button>
        </div>
      </div>
      <Button v-else variant="outline" class="h-10 w-full rounded-2xl" @click="showForm = true">
        <Send class="size-4" />
        {{ locale.t.agent.sendAnOffer }}
      </Button>
    </template>
  </GlassCard>
</template>
