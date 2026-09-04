<script setup lang="ts">
import { FileEdit } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import Drawer from '@/core/ui/Drawer.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import PricelistBuilder from '@/modules/orders/components/PricelistBuilder.vue'
import AmendmentCard from '@/modules/orders/components/AmendmentCard.vue'
import { useAmendments } from '@/modules/orders/composables/useAmendments'
import type { OfferItem, PricelistItemInput } from '@/modules/orders/types/order'

const props = defineProps<{
  orderId: number
  isActive: boolean
  initialItems: OfferItem[]
  initialDeadlineDays: number | null
}>()

const locale = useLocaleStore()
const { haptic } = useTelegram()
const { amendments, openAmendment, submitting, load, propose, approve, reject, cancel } = useAmendments()

const drawerOpen = ref(false)
const reason = ref('')

onMounted(() => load(props.orderId))

function openProposeDrawer() {
  haptic('light')
  reason.value = ''
  drawerOpen.value = true
}

async function submitProposal(payload: { items: PricelistItemInput[], deadlineDays: number }) {
  const ok = await propose(props.orderId, {
    items: payload.items,
    deadline_days: payload.deadlineDays,
    reason: reason.value.trim() || null,
  })
  if (ok) {
    haptic('medium')
    drawerOpen.value = false
  }
}
</script>

<template>
  <section
    v-if="isActive || amendments.length > 0"
    class="space-y-3"
  >
    <div class="flex items-center justify-between gap-2 px-1">
      <div class="flex items-center gap-2">
        <FileEdit class="size-4 text-primary" />
        <h3 class="text-base font-semibold text-foreground">
          {{ locale.t.amendments.sectionTitle }}
        </h3>
      </div>
      <Button
        v-if="isActive && !openAmendment"
        variant="outline"
        size="sm"
        class="rounded-full"
        @click="openProposeDrawer"
      >
        {{ locale.t.amendments.propose }}
      </Button>
    </div>

    <p
      v-if="amendments.length === 0"
      class="rounded-2xl bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground dark:bg-white/5"
    >
      {{ locale.t.amendments.emptyHint }}
    </p>

    <AmendmentCard
      v-for="amendment in amendments"
      :key="amendment.id"
      :amendment="amendment"
      :submitting="submitting"
      @approve="approve"
      @reject="reject"
      @cancel="cancel"
    />

    <Drawer
      v-model:open="drawerOpen"
      :title="locale.t.amendments.proposeTitle"
    >
      <div class="space-y-4 pb-2">
        <p class="rounded-2xl bg-muted/50 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground dark:bg-white/5">
          {{ locale.t.amendments.proposeHint }}
        </p>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-foreground">
            {{ locale.t.amendments.reasonLabel }}
          </label>
          <textarea
            v-model="reason"
            rows="2"
            :placeholder="locale.t.amendments.reasonPlaceholder"
            class="glass-input w-full resize-none text-sm"
          />
        </div>

        <PricelistBuilder
          :initial-items="initialItems"
          :initial-deadline-days="initialDeadlineDays"
          :submitting="submitting"
          @submit="submitProposal"
        />
      </div>
    </Drawer>
  </section>
</template>
