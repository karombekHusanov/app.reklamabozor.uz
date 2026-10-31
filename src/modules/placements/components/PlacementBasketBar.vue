<script setup lang="ts">
import { ArrowRight, ListChecks, Trash2, X } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Drawer from '@/core/ui/Drawer.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { ROUTES } from '@/modules/shell/constants/routes'
import { usePlacementSelectionStore } from '@/modules/placements/stores/placement-selection.store'

/**
 * Cart-style bar at the bottom of the map: how many screens are picked, a list
 * to review/remove them, and "Continue" into the order form.
 */
const emit = defineEmits<{ focus: [id: number] }>()

const locale = useLocaleStore()
const router = useRouter()
const selection = usePlacementSelectionStore()
const { haptic } = useTelegram()

const t = computed(() => locale.t.placements)
const listOpen = ref(false)

const title = computed(() => t.value.basketTitle.replace('{n}', String(selection.count)))

function proceed() {
  if (selection.isEmpty) return
  haptic('medium')
  router.push({ path: ROUTES.newOrder, query: { placements: selection.ids.join(',') } })
}

function remove(id: number) {
  haptic('light')
  selection.remove(id)
  if (selection.isEmpty) listOpen.value = false
}

function clearAll() {
  haptic('medium')
  selection.clear()
  listOpen.value = false
}

function focus(id: number) {
  listOpen.value = false
  emit('focus', id)
}
</script>

<template>
  <div class="rounded-3xl bg-white p-3 shadow-2xl shadow-[#02305C]/35">
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-3 text-left"
        @click="listOpen = true"
      >
        <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ListChecks class="size-5" />
        </span>
        <span class="min-w-0">
          <span class="block truncate text-[15px] font-bold text-slate-900">{{ title }}</span>
          <span class="block truncate text-xs text-slate-500">{{ t.basketHint }}</span>
        </span>
      </button>
      <button
        type="button"
        class="btn-brand flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold"
        @click="proceed"
      >
        {{ t.continueBtn }}
        <ArrowRight class="size-4" />
      </button>
    </div>

    <Drawer
      v-model:open="listOpen"
      :title="t.listTitle"
    >
      <ul class="space-y-2 pb-2">
        <li
          v-for="(item, index) in selection.items"
          :key="item.id"
          class="flex items-center gap-3 rounded-2xl bg-secondary px-3.5 py-3"
        >
          <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary">{{ index + 1 }}</span>
          <button
            type="button"
            class="min-w-0 flex-1 text-left"
            @click="focus(item.id)"
          >
            <span class="block truncate text-sm font-semibold text-foreground">{{ item.address }}</span>
            <span class="block truncate text-xs text-muted-foreground">{{ item.owner.name }}</span>
          </button>
          <button
            type="button"
            class="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground"
            :aria-label="t.remove"
            @click="remove(item.id)"
          >
            <X class="size-4" />
          </button>
        </li>
      </ul>

      <div class="flex gap-2 pb-2 pt-1">
        <button
          type="button"
          class="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-secondary text-sm font-semibold text-foreground"
          @click="clearAll"
        >
          <Trash2 class="size-4" />
          {{ t.clearAll }}
        </button>
        <button
          type="button"
          class="btn-brand flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-bold"
          @click="proceed"
        >
          {{ t.continueBtn }}
          <ArrowRight class="size-4" />
        </button>
      </div>
    </Drawer>
  </div>
</template>
