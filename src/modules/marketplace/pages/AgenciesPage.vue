<script setup lang="ts">
import { Store } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { cn } from '@/core/lib/utils'
import { getApiErrorMessage } from '@/core/api/api-error'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import AgentCard from '@/modules/marketplace/components/AgentCard.vue'
import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'

const locale = useLocaleStore()
const router = useRouter()

const agents = ref<PublicAgent[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const activeCategory = ref<'all' | number>('all')

onMounted(async () => {
  try {
    agents.value = await fetchTopAgents(50)
  }
  catch (e) {
    error.value = getApiErrorMessage(e)
  }
  finally {
    loading.value = false
  }
})

const categories = computed(() => {
  const map = new Map<number, string>()
  agents.value.forEach(agent => agent.categories.forEach(c => map.set(c.id, categoryName(c, locale.locale))))
  return [...map.entries()].map(([id, name]) => ({ id, name }))
})

const filtered = computed(() =>
  agents.value.filter(agent =>
    activeCategory.value === 'all'
    || agent.categories.some(c => c.id === activeCategory.value),
  ),
)

function openAgent(id: number) {
  router.push(`/agents/${id}`)
}
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="locale.t.agencies.title"
      :subtitle="locale.t.agencies.subtitle"
      show-back
    />

    <section class="space-y-4 px-4">
      <div
        v-if="categories.length"
        class="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          class="pressable shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition"
          :class="activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'glass-chip'"
          @click="activeCategory = 'all'"
        >
          {{ locale.t.agencies.all }}
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          :class="cn(
            'pressable shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition',
            activeCategory === category.id ? 'bg-primary text-primary-foreground' : 'glass-chip',
          )"
          @click="activeCategory = category.id"
        >
          {{ category.name }}
        </button>
      </div>

      <template v-if="loading">
        <Skeleton
          v-for="n in 4"
          :key="n"
          class="h-24 w-full rounded-3xl"
        />
      </template>

      <p
        v-else-if="error"
        class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ error }}
      </p>

      <GlassCard
        v-else-if="filtered.length === 0"
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="Store"
          :title="locale.t.agencies.emptyTitle"
          :description="agents.length === 0 ? locale.t.agencies.emptyApproved : locale.t.agencies.emptyTry"
        />
      </GlassCard>

      <div
        v-else
        class="space-y-3"
      >
        <AgentCard
          v-for="agent in filtered"
          :key="agent.id"
          :agent="agent"
          @open="openAgent(agent.id)"
        />
      </div>
    </section>
  </div>
</template>
