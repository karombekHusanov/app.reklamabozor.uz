<script setup lang="ts">
import { CircleCheck, Loader2 } from '@lucide/vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Avatar from '@/core/ui/Avatar.vue'
import Badge from '@/core/ui/Badge.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatPrice, offerStatusVariant } from '@/modules/orders/lib/order-status'
import type { Offer } from '@/modules/orders/types/order'

defineProps<{
  offer: Offer
  /** Whether the client may still pick this offer. */
  selectable?: boolean
  accepting?: boolean
}>()

defineEmits<{ accept: [] }>()

const locale = useLocaleStore()
</script>

<template>
  <GlassCard class="space-y-3" :class="offer.status === 'accepted' && 'ring-2 ring-emerald-500/40'">
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <Avatar
          :src="offer.agent.company_logo"
          :name="offer.agent.company_name ?? locale.t.orders.agencyFallback"
          size="md"
        />
        <div class="min-w-0">
          <p class="truncate font-semibold leading-tight">
            {{ offer.agent.company_name ?? locale.t.orders.agencyFallback }}
          </p>
          <p v-if="offer.agent.location_label" class="truncate text-xs text-muted-foreground">
            {{ offer.agent.location_label }}
          </p>
        </div>
      </div>
      <Badge :variant="offerStatusVariant(offer.status)" class="shrink-0">
        {{ locale.t.orders.offerStatus[offer.status] }}
      </Badge>
    </div>

    <p class="text-lg font-semibold text-primary">
      {{ formatPrice(offer.price) }}
    </p>

    <p class="text-sm text-muted-foreground">
      {{ offer.comment }}
    </p>

    <Button
      v-if="selectable && offer.status === 'pending'"
      class="h-11 w-full rounded-2xl"
      :disabled="accepting"
      @click="$emit('accept')"
    >
      <Loader2 v-if="accepting" class="size-4 animate-spin" />
      <CircleCheck v-else class="size-4" />
      {{ locale.t.orders.workWithAgency }}
    </Button>
  </GlassCard>
</template>
