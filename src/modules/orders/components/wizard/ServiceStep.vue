<script setup lang="ts">
import { inject } from 'vue'
import { cn } from '@/core/lib/utils'
import { categoryName } from '@/core/i18n/category-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { WIZARD_KEY } from '@/modules/orders/components/wizard/context'
import { categoryIcon } from '@/modules/orders/lib/category-icon'

const locale = useLocaleStore()
const ctx = inject(WIZARD_KEY)!

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

    <div class="space-y-2.5">
      <button
        v-for="category in ctx.categories"
        :key="category.id"
        type="button"
        :class="cn(
          'pressable flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left transition',
          ctx.draft.category_id === category.id
            ? 'border-primary ring-2 ring-primary/15'
            : 'border-border',
        )"
        @click="select(category.id)"
      >
        <span
          :class="cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors',
            ctx.draft.category_id === category.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/10 text-primary',
          )"
        >
          <component
            :is="categoryIcon(category)"
            class="size-5"
          />
        </span>

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
      v-if="ctx.errors.category_id"
      class="text-sm text-destructive"
    >
      {{ ctx.errors.category_id }}
    </p>
  </div>
</template>
