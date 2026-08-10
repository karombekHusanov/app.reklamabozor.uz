<script setup lang="ts">
import { Search } from '@lucide/vue'
import { computed, inject, ref } from 'vue'
import { cn } from '@/core/lib/utils'
import { categoryName } from '@/core/i18n/category-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { WIZARD_KEY } from '@/modules/orders/components/wizard/context'

const locale = useLocaleStore()
const ctx = inject(WIZARD_KEY)!
const query = ref('')

const filteredCategories = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return ctx.categories
  return ctx.categories.filter(category =>
    category.name_uz.toLowerCase().includes(q)
    || category.name_ru.toLowerCase().includes(q),
  )
})

function select(id: number) {
  ctx.draft.category_id = id
  delete ctx.errors.category_id
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <h2 class="text-lg font-bold text-foreground">
        {{ locale.t.orders.wizard.serviceTitle }}
      </h2>
      <p class="text-sm text-muted-foreground">
        {{ locale.t.orders.wizard.serviceSubtitle }}
      </p>
    </div>

    <div class="flex h-11 items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 shadow-sm dark:bg-white/5">
      <Search class="size-4 shrink-0 text-muted-foreground" />
      <input
        v-model="query"
        type="search"
        :placeholder="locale.t.orders.wizard.serviceSearchPlaceholder"
        class="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        autocomplete="off"
      >
    </div>

    <div
      v-if="filteredCategories.length > 0"
      class="space-y-2.5"
    >
      <button
        v-for="category in filteredCategories"
        :key="category.id"
        type="button"
        :class="cn(
          'pressable flex w-full items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 text-left transition',
          ctx.draft.category_id === category.id
            ? 'border-primary ring-2 ring-primary/15'
            : 'border-border',
        )"
        @click="select(category.id)"
      >
        <span class="min-w-0 grow font-medium text-foreground">
          {{ categoryName(category, locale.locale) }}
        </span>

        <span
          :class="cn(
            'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            ctx.draft.category_id === category.id ? 'border-primary' : 'border-muted-foreground/40',
          )"
        >
          <span
            v-if="ctx.draft.category_id === category.id"
            class="size-2.5 rounded-full bg-primary"
          />
        </span>
      </button>
    </div>

    <p
      v-else
      class="py-6 text-center text-sm text-muted-foreground"
    >
      {{ locale.t.orders.wizard.serviceSearchEmpty }}
    </p>

    <p
      v-if="ctx.errors.category_id"
      class="text-sm text-destructive"
    >
      {{ ctx.errors.category_id }}
    </p>
  </div>
</template>
