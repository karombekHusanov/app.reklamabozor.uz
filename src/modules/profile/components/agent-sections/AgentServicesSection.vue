<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '@/modules/agent/types/agent'
import { categoryName } from '@/core/i18n/category-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import EmptyState from '@/core/ui/EmptyState.vue'
import { categoryIcon } from '@/modules/orders/lib/category-icon'
import AgentProfileSectionShell from '@/modules/profile/components/agent-sections/AgentProfileSectionShell.vue'
import { categoryAccent, categoryLayoutMode } from '@/modules/profile/lib/category-accent'

const props = defineProps<{
  categories: Category[]
}>()

const locale = useLocaleStore()

const sortedCategories = computed(() =>
  [...props.categories].sort((a, b) => a.sort_order - b.sort_order),
)

const layout = computed(() => categoryLayoutMode(sortedCategories.value.length))

const featuredCategory = computed(() => sortedCategories.value[0] ?? null)
const secondaryCategories = computed(() => sortedCategories.value.slice(1))
const gridCategories = computed(() => sortedCategories.value)
const cloudCategories = computed(() => sortedCategories.value)
</script>

<template>
  <AgentProfileSectionShell :title="locale.t.profile.agentServicesTitle">
    <EmptyState
      v-if="layout === 'empty'"
      class="py-6"
      :title="locale.t.profile.agentServicesEmpty"
    />

    <template v-else>
      <p class="mb-3 text-[11px] leading-snug text-muted-foreground">
        {{ sortedCategories.length }} {{ locale.t.profile.agentServicesCount }}
      </p>

    <!-- 1 category — hero tile -->
    <article
      v-if="layout === 'solo' && featuredCategory"
      class="agent-category-tile agent-category-tile--solo"
      :class="categoryAccent(featuredCategory).tile"
    >
      <div
        class="agent-category-tile__glow"
        :class="categoryAccent(featuredCategory).glow"
      />
      <span
        class="agent-category-tile__icon agent-category-tile__icon--lg"
        :class="categoryAccent(featuredCategory).icon"
      >
        <component
          :is="categoryIcon(featuredCategory)"
          class="size-6"
        />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-[15px] font-bold leading-tight text-foreground">
          {{ categoryName(featuredCategory, locale.locale) }}
        </p>
        <p class="mt-1 text-[10px] text-muted-foreground">
          {{ locale.t.profile.agentServicesSoloHint }}
        </p>
      </div>
    </article>

    <!-- 2 categories — split duo -->
    <div
      v-else-if="layout === 'pair'"
      class="grid grid-cols-2 gap-2.5"
    >
      <article
        v-for="(category, index) in sortedCategories"
        :key="category.id"
        class="agent-category-tile agent-category-tile--pair"
        :class="categoryAccent(category, index).tile"
      >
        <div
          class="agent-category-tile__glow"
          :class="categoryAccent(category, index).glow"
        />
        <span
          class="agent-category-tile__icon"
          :class="categoryAccent(category, index).icon"
        >
          <component
            :is="categoryIcon(category)"
            class="size-[1.15rem]"
          />
        </span>
        <p class="mt-3 text-[12px] font-bold leading-snug text-foreground">
          {{ categoryName(category, locale.locale) }}
        </p>
      </article>
    </div>

    <!-- 3 categories — featured + pair -->
    <div
      v-else-if="layout === 'trio' && featuredCategory"
      class="space-y-2.5"
    >
      <article
        class="agent-category-tile agent-category-tile--featured"
        :class="categoryAccent(featuredCategory).tile"
      >
        <div
          class="agent-category-tile__glow"
          :class="categoryAccent(featuredCategory).glow"
        />
        <span
          class="agent-category-tile__icon agent-category-tile__icon--md"
          :class="categoryAccent(featuredCategory).icon"
        >
          <component
            :is="categoryIcon(featuredCategory)"
            class="size-5"
          />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-[14px] font-bold leading-tight text-foreground">
            {{ categoryName(featuredCategory, locale.locale) }}
          </p>
          <p class="mt-0.5 text-[10px] text-muted-foreground">
            {{ locale.t.profile.agentServicesFeatured }}
          </p>
        </div>
      </article>

      <div class="grid grid-cols-2 gap-2.5">
        <article
          v-for="(category, index) in secondaryCategories"
          :key="category.id"
          class="agent-category-tile agent-category-tile--compact"
          :class="categoryAccent(category, index + 1).tile"
        >
          <span
            class="agent-category-tile__icon agent-category-tile__icon--sm"
            :class="categoryAccent(category, index + 1).icon"
          >
            <component
              :is="categoryIcon(category)"
              class="size-3.5"
            />
          </span>
          <p class="mt-2 text-[11px] font-bold leading-snug text-foreground">
            {{ categoryName(category, locale.locale) }}
          </p>
        </article>
      </div>
    </div>

    <!-- 4–6 categories — balanced grid -->
    <div
      v-else-if="layout === 'grid'"
      class="grid grid-cols-2 gap-2.5"
    >
      <article
        v-for="(category, index) in gridCategories"
        :key="category.id"
        class="agent-category-tile agent-category-tile--grid"
        :class="[
          categoryAccent(category, index).tile,
          index === 0 && gridCategories.length >= 5 ? 'col-span-2' : '',
        ]"
      >
        <div
          class="agent-category-tile__glow"
          :class="categoryAccent(category, index).glow"
        />
        <span
          class="agent-category-tile__icon"
          :class="categoryAccent(category, index).icon"
        >
          <component
            :is="categoryIcon(category)"
            class="size-[1.15rem]"
          />
        </span>
        <p class="mt-2.5 text-[12px] font-bold leading-snug text-foreground">
          {{ categoryName(category, locale.locale) }}
        </p>
        <span class="agent-category-tile__index">{{ index + 1 }}</span>
      </article>
    </div>

    <!-- 7+ categories — flowing chip cloud -->
    <div
      v-else
      class="flex flex-wrap gap-2"
    >
      <article
        v-for="(category, index) in cloudCategories"
        :key="category.id"
        class="agent-category-chip"
        :class="categoryAccent(category, index).tile"
      >
        <span
          class="agent-category-chip__icon"
          :class="categoryAccent(category, index).icon"
        >
          <component
            :is="categoryIcon(category)"
            class="size-3.5"
          />
        </span>
        <span class="text-[11px] font-semibold leading-none text-foreground">
          {{ categoryName(category, locale.locale) }}
        </span>
      </article>
    </div>
    </template>
  </AgentProfileSectionShell>
</template>
