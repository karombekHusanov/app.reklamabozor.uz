<script setup lang="ts">
import { Search, Store } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { cn } from '@/core/lib/utils'
import { getApiErrorMessage } from '@/core/api/api-error'
import AgentCard from '@/modules/marketplace/components/AgentCard.vue'
import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'

const agents = ref<PublicAgent[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const query = ref('')
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

// Category chips built from the categories the fetched agents actually serve.
const categories = computed(() => {
  const map = new Map<number, string>()
  agents.value.forEach(agent => agent.categories.forEach(c => map.set(c.id, c.name_uz)))
  return [...map.entries()].map(([id, name]) => ({ id, name }))
})

const filtered = computed(() => {
  const search = query.value.trim().toLowerCase()

  return agents.value.filter((agent) => {
    const matchesCategory = activeCategory.value === 'all'
      || agent.categories.some(c => c.id === activeCategory.value)

    const matchesQuery = !search
      || agent.company_name.toLowerCase().includes(search)
      || (agent.bio?.toLowerCase().includes(search) ?? false)
      || (agent.location_label?.toLowerCase().includes(search) ?? false)

    return matchesCategory && matchesQuery
  })
})
</script>

<template>
  <div>
    <AppHeader
      title="Agents"
      subtitle="Find your next campaign partner"
    />

    <section class="space-y-5 px-5">
      <GlassCard padding="sm" class="flex items-center gap-3">
        <Search class="size-5 text-muted-foreground" />
        <input
          v-model="query"
          type="search"
          placeholder="Search agencies, services, locations…"
          class="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        >
      </GlassCard>

      <div v-if="categories.length" class="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
          :class="activeCategory === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'glass-chip'"
          @click="activeCategory = 'all'"
        >
          All
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          :class="cn(
            'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
            activeCategory === category.id ? 'bg-primary text-primary-foreground shadow-sm' : 'glass-chip',
          )"
          @click="activeCategory = category.id"
        >
          {{ category.name }}
        </button>
      </div>

      <!-- Loading -->
      <template v-if="loading">
        <Skeleton v-for="n in 3" :key="n" class="h-40 w-full rounded-3xl" />
      </template>

      <!-- Error -->
      <p v-else-if="error" class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {{ error }}
      </p>

      <!-- Empty -->
      <GlassCard v-else-if="filtered.length === 0" padding="none" class="overflow-hidden">
        <EmptyState
          :icon="Store"
          title="No agencies found"
          :description="agents.length === 0
            ? 'Approved agencies will appear here soon.'
            : 'Try a different search or category.'"
        />
      </GlassCard>

      <!-- List -->
      <template v-else>
        <p class="px-1 text-sm text-muted-foreground">
          {{ filtered.length }} {{ filtered.length === 1 ? 'agency' : 'agencies' }} available
        </p>
        <div class="space-y-4">
          <AgentCard
            v-for="agent in filtered"
            :key="agent.id"
            :agent="agent"
          />
        </div>
      </template>
    </section>
  </div>
</template>
