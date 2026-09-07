<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Store } from '@lucide/vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import AgentCard from '@/modules/marketplace/components/AgentCard.vue'
import { categoryName } from '@/core/i18n/category-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { fetchTopAgents, type PublicAgent } from '@/modules/marketplace/services/agents.service'
import { fetchCategories } from '@/modules/orders/services/orders.service'
import type { Category } from '@/modules/agent/types/agent'

const props = defineProps<{ id: string }>()

const locale = useLocaleStore()
const router = useRouter()

const category = ref<Category | null>(null)
const providers = ref<PublicAgent[]>([])
const loading = ref(true)

const categoryId = computed(() => Number(props.id))

const title = computed(() =>
  category.value ? categoryName(category.value, locale.locale) : locale.t.categoryDetail.notFound,
)

const subtitle = computed(() =>
  loading.value || providers.value.length === 0
    ? locale.t.categoryDetail.subtitle
    : locale.t.categoryDetail.providersCount.replace('{count}', String(providers.value.length)),
)

onMounted(async () => {
  const [categories, agents] = await Promise.allSettled([
    fetchCategories(),
    fetchTopAgents(50, undefined, undefined, { category_ids: [categoryId.value] }),
  ])

  if (categories.status === 'fulfilled') {
    category.value = categories.value.find(item => item.id === categoryId.value) ?? null
  }
  providers.value = agents.status === 'fulfilled' ? agents.value : []
  loading.value = false
})

function openAgent(id: number) {
  void router.push(`/agents/${id}`)
}
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="title"
      :subtitle="subtitle"
      show-back
    />

    <section class="space-y-3 px-4">
      <template v-if="loading">
        <Skeleton
          v-for="n in 3"
          :key="n"
          class="h-[132px] w-full rounded-[1.25rem]"
        />
      </template>

      <template v-else-if="providers.length === 0">
        <GlassCard
          padding="none"
          class="overflow-hidden"
        >
          <EmptyState
            :icon="Store"
            :title="locale.t.categoryDetail.empty"
            :description="locale.t.categoryDetail.emptyBody"
          />
        </GlassCard>
      </template>

      <template v-else>
        <AgentCard
          v-for="agent in providers"
          :key="agent.id"
          :agent="agent"
          @open="openAgent(agent.id)"
        />
      </template>
    </section>
  </div>
</template>
