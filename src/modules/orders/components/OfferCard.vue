<script setup lang="ts">
import { ChevronDown, CircleCheck, Loader2, MessageCircle, Receipt } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import Avatar from '@/core/ui/Avatar.vue'
import Badge from '@/core/ui/Badge.vue'
import PricelistTable from '@/modules/orders/components/PricelistTable.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { getApiErrorMessage } from '@/core/api/api-error'
import { canAcceptOffer, formatPrice, isInterestOffer, offerStatusVariant } from '@/modules/orders/lib/order-status'
import { openOrderChat } from '@/modules/chat/services/chat.service'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { Offer } from '@/modules/orders/types/order'

const props = defineProps<{
  offer: Offer
  /** Whether the client may still pick this offer. */
  selectable?: boolean
  accepting?: boolean
}>()

defineEmits<{ accept: [] }>()

const locale = useLocaleStore()
const router = useRouter()
const toast = useToast()
const { haptic } = useTelegram()

const chatOpening = ref(false)
const showItems = ref(false)

const interest = computed(() => isInterestOffer(props.offer))
const items = computed(() => props.offer.items ?? [])
const hasItems = computed(() => items.value.length > 0)
const showAccept = computed(() =>
  Boolean(props.selectable) && props.offer.status === 'pending' && canAcceptOffer(props.offer),
)

function openAgentProfile() {
  const profileId = props.offer.agent.profile_id
  if (!profileId) return
  haptic('light')
  void router.push(`/agents/${profileId}`)
}

async function openChat() {
  if (chatOpening.value) return
  chatOpening.value = true
  haptic('light')
  try {
    if (props.offer.chat_id) {
      await router.push(ROUTES.chatDirect(props.offer.chat_id))
      return
    }
    const chat = await openOrderChat(props.offer.id)
    await router.push(ROUTES.chatDirect(chat.id))
  }
  catch (e) {
    toast.error(getApiErrorMessage(e))
  }
  finally {
    chatOpening.value = false
  }
}
</script>

<template>
  <GlassCard
    class="space-y-3"
    :class="offer.status === 'accepted' && 'ring-2 ring-emerald-500/40'"
  >
    <div class="flex items-start justify-between gap-3">
      <button
        type="button"
        class="pressable flex min-w-0 flex-1 items-center gap-3 text-left"
        :disabled="!offer.agent.profile_id"
        @click="openAgentProfile"
      >
        <Avatar
          :src="offer.agent.company_logo"
          :name="offer.agent.company_name ?? locale.t.orders.agencyFallback"
          size="md"
        />
        <div class="min-w-0">
          <p class="truncate font-semibold leading-tight">
            {{ offer.agent.company_name ?? locale.t.orders.agencyFallback }}
          </p>
          <p
            v-if="offer.agent.location_label"
            class="truncate text-xs text-muted-foreground"
          >
            {{ offer.agent.location_label }}
          </p>
        </div>
      </button>
      <Badge
        :variant="offerStatusVariant(offer.status)"
        class="shrink-0"
      >
        {{ locale.t.orders.offerStatus[offer.status] }}
      </Badge>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Badge
        v-if="interest"
        variant="primary"
        class="shrink-0"
      >
        {{ locale.t.orders.interestBadge }}
      </Badge>
      <template v-else>
        <p class="text-lg font-semibold text-primary">
          {{ formatPrice(offer.price) }}
        </p>
        <span
          v-if="offer.price_updated_at"
          class="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300"
        >
          {{ locale.t.chat.priceUpdatedBadge }}
        </span>
      </template>
    </div>

    <p
      v-if="offer.comment"
      class="text-sm text-muted-foreground"
    >
      {{ offer.comment }}
    </p>

    <!-- Pricelist (line items) — collapsible so the client can compare agencies -->
    <div v-if="hasItems">
      <button
        type="button"
        class="pressable flex w-full items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground dark:bg-white/5"
        @click="showItems = !showItems"
      >
        <span class="inline-flex items-center gap-1.5">
          <Receipt class="size-3.5 text-primary" />
          {{ showItems ? locale.t.orders.pricelist.hide : locale.t.orders.pricelist.show }}
          <span class="text-muted-foreground">({{ items.length }})</span>
        </span>
        <ChevronDown
          class="size-4 text-muted-foreground transition-transform"
          :class="showItems && 'rotate-180'"
        />
      </button>
      <PricelistTable
        v-if="showItems"
        class="mt-2"
        :items="items"
        :total="offer.price"
      />
    </div>

    <div class="flex flex-col gap-2">
      <Button
        variant="outline"
        class="h-11 w-full rounded-2xl"
        :disabled="chatOpening"
        @click="openChat"
      >
        <Loader2
          v-if="chatOpening"
          class="size-4 animate-spin"
        />
        <MessageCircle
          v-else
          class="size-4"
        />
        {{ locale.t.chat.openChat }}
      </Button>

      <Button
        v-if="showAccept"
        class="h-11 w-full rounded-2xl"
        :disabled="accepting"
        @click="$emit('accept')"
      >
        <Loader2
          v-if="accepting"
          class="size-4 animate-spin"
        />
        <CircleCheck
          v-else
          class="size-4"
        />
        {{ locale.t.orders.workWithAgency }}
      </Button>
    </div>
  </GlassCard>
</template>
