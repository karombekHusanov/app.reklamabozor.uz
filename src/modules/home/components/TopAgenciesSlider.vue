<script setup lang="ts">
import { BadgeCheck, MapPin } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Avatar from '@/core/ui/Avatar.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'
import { useLocaleStore } from '@/core/i18n/locale.store'

const locale = useLocaleStore()

const agents = ref<PublicAgent[]>([])
const loading = ref(true)

const scroller = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function advance() {
  const el = scroller.value
  if (!el || agents.value.length < 2) return

  activeIndex.value = (activeIndex.value + 1) % agents.value.length
  const card = el.children[activeIndex.value] as HTMLElement | undefined
  if (card) el.scrollTo({ left: card.offsetLeft - 20, behavior: 'smooth' })
}

function startAuto() {
  stopAuto()
  timer = setInterval(advance, 3200)
}

function stopAuto() {
  if (timer) clearInterval(timer)
  timer = null
}

onMounted(async () => {
  try {
    agents.value = await fetchTopAgents(10)
  }
  finally {
    loading.value = false
    if (agents.value.length > 1) startAuto()
  }
})

onBeforeUnmount(stopAuto)
</script>

<template>
  <div v-if="loading || agents.length" class="space-y-3">
    <div class="flex items-center justify-between px-1">
      <h2 class="text-lg font-semibold">
        {{ locale.t.home.topAgencies }}
      </h2>
      <span class="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <BadgeCheck class="size-3.5 text-primary" />
        {{ locale.t.home.verified }}
      </span>
    </div>

    <div v-if="loading" class="flex gap-3 overflow-hidden">
      <Skeleton v-for="n in 2" :key="n" class="h-20 w-60 shrink-0 rounded-3xl" />
    </div>

    <div
      v-else
      ref="scroller"
      class="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      @pointerdown="stopAuto"
    >
      <GlassCard
        v-for="agent in agents"
        :key="agent.id"
        padding="sm"
        class="w-60 shrink-0 snap-start"
      >
        <div class="flex items-center gap-3">
          <Avatar :src="agent.company_logo" :name="agent.company_name" size="md" />
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold leading-tight">
              {{ agent.company_name }}
            </p>
            <p v-if="agent.location_label" class="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin class="size-3 shrink-0" />
              <span class="truncate">{{ agent.location_label }}</span>
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  </div>
</template>
