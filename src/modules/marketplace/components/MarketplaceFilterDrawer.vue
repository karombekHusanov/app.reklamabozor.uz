<script setup lang="ts">
import { Check, X } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/core/ui/drawer'
import { Button } from '@/core/ui/button'
import { Checkbox } from '@/core/ui/checkbox'
import { categoryName } from '@/core/i18n/category-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import type { MarketplaceFilterState } from '@/modules/marketplace/lib/marketplace-filters'
import type { Category } from '@/modules/agent/types/agent'

const props = defineProps<{
  categories: Category[]
  modelValue: MarketplaceFilterState
  /** i18n namespace: agencies | designers */
  copy: {
    filterTitle: string
    filterCategory: string
    filterAll: string
    filterApply: string
    filterReset: string
  }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: MarketplaceFilterState]
}>()

const open = defineModel<boolean>('open', { default: false })

const locale = useLocaleStore()
const { haptic } = useTelegram()

const draftCategoryIds = ref<number[]>([])

watch(open, (isOpen) => {
  if (!isOpen) return
  draftCategoryIds.value = [...props.modelValue.categoryIds]
})

const categoryOptions = computed(() =>
  props.categories.map(category => ({
    id: category.id,
    name: categoryName(category, locale.locale),
  })),
)

function isCategorySelected(id: number) {
  return draftCategoryIds.value.includes(id)
}

function setCategoryChecked(id: number, checked: boolean | 'indeterminate') {
  haptic('light')
  if (checked === true) {
    if (!draftCategoryIds.value.includes(id)) {
      draftCategoryIds.value = [...draftCategoryIds.value, id]
    }
    return
  }
  draftCategoryIds.value = draftCategoryIds.value.filter(categoryId => categoryId !== id)
}

function clearCategories() {
  haptic('light')
  draftCategoryIds.value = []
}

function onAllCategoriesChecked(checked: boolean | 'indeterminate') {
  if (checked === true) clearCategories()
}

function apply() {
  haptic('medium')
  emit('update:modelValue', {
    categoryIds: [...draftCategoryIds.value],
  })
  open.value = false
}

function reset() {
  haptic('light')
  draftCategoryIds.value = []
  emit('update:modelValue', { categoryIds: [] })
  open.value = false
}
</script>

<template>
  <Drawer v-model:open="open">
    <DrawerContent
      class="z-[100] max-h-[85vh] rounded-t-[28px] border-border/60 bg-card pb-[max(0.5rem,env(safe-area-inset-bottom))] dark:bg-[#0c1f36]"
    >
      <DrawerHeader class="shrink-0 flex-row items-center justify-between gap-3 px-5 pb-2 pt-1 text-left">
        <DrawerTitle class="text-base font-bold leading-tight">
          {{ copy.filterTitle }}
        </DrawerTitle>
        <DrawerDescription class="sr-only">
          {{ copy.filterTitle }}
        </DrawerDescription>
        <DrawerClose
          class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:scale-95 dark:bg-white/10"
        >
          <X class="size-4" />
        </DrawerClose>
      </DrawerHeader>

      <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-3">
        <section class="space-y-2">
          <h3 class="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {{ copy.filterCategory }}
          </h3>
          <div class="space-y-2">
            <div
              class="live-orders-filter-region pressable"
              :class="draftCategoryIds.length === 0 && 'live-orders-filter-region--selected'"
              @click="clearCategories"
            >
              <Checkbox
                :model-value="draftCategoryIds.length === 0"
                @click.stop
                @update:model-value="onAllCategoriesChecked"
              />
              <span class="live-orders-filter-region__label">
                {{ copy.filterAll }}
              </span>
            </div>

            <div
              v-for="category in categoryOptions"
              :key="category.id"
              class="live-orders-filter-region pressable"
              :class="isCategorySelected(category.id) && 'live-orders-filter-region--selected'"
              @click="setCategoryChecked(category.id, !isCategorySelected(category.id))"
            >
              <Checkbox
                :model-value="isCategorySelected(category.id)"
                @click.stop
                @update:model-value="(value: boolean | 'indeterminate') => setCategoryChecked(category.id, value)"
              />
              <span class="live-orders-filter-region__label">
                {{ category.name }}
              </span>
            </div>
          </div>
        </section>
      </div>

      <DrawerFooter class="shrink-0 flex-row gap-2 border-t border-border/60 bg-card px-4 pt-3 dark:bg-[#0c1f36]">
        <Button
          type="button"
          variant="outline"
          class="h-12 flex-1 rounded-2xl text-sm"
          @click="reset"
        >
          {{ copy.filterReset }}
        </Button>
        <Button
          type="button"
          class="h-12 flex-1 rounded-2xl text-sm"
          @click="apply"
        >
          <Check class="size-4" />
          {{ copy.filterApply }}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
