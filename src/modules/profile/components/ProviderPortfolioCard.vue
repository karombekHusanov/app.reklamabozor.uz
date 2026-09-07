<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight, Plus } from '@lucide/vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { PortfolioItem } from '@/modules/agent/types/agent'

const props = defineProps<{ items: PortfolioItem[] }>()

const emit = defineEmits<{ navigate: [to: string] }>()

const locale = useLocaleStore()
const { haptic } = useTelegram()

/** Three covers plus the add tile — a glance, not a gallery. */
const covers = computed(() => props.items.slice(0, 3))

const countLabel = computed(() =>
  props.items.length
    ? locale.t.profile.portfolioCount.replace('{count}', String(props.items.length))
    : locale.t.profile.portfolioEmpty,
)

function manage() {
  haptic('light')
  emit('navigate', `${ROUTES.profileEdit}?section=portfolio`)
}
</script>

<template>
  <GlassCard class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <p class="profile-eyebrow">
        {{ locale.t.profile.portfolioTitle }}
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-1 text-[12.5px] font-bold text-primary"
        @click="manage"
      >
        {{ locale.t.profile.portfolioManage }}
        <ChevronRight class="size-3.5" />
      </button>
    </div>

    <div class="grid grid-cols-4 gap-2">
      <button
        v-for="item in covers"
        :key="item.id"
        type="button"
        class="aspect-square overflow-hidden rounded-2xl bg-muted"
        @click="manage"
      >
        <img
          v-if="item.image"
          :src="item.image"
          :alt="item.title"
          class="size-full object-cover"
        >
      </button>

      <button
        type="button"
        class="grid aspect-square place-items-center rounded-2xl border border-dashed border-border text-muted-foreground transition active:scale-95"
        :aria-label="locale.t.profile.portfolioManage"
        @click="manage"
      >
        <Plus class="size-[18px]" />
      </button>
    </div>

    <p class="text-[12px] text-muted-foreground">
      {{ countLabel }}
    </p>
  </GlassCard>
</template>
