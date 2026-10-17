<script setup lang="ts">
import { Check, ChevronLeft, ChevronRight } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { categoryFullName, categoryName } from '@/core/i18n/category-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { Category } from '@/modules/agent/types/agent'

/**
 * Drill-down picker over the nested category tree.
 *
 * Takes the flat `/categories` list (tree order, `parent_id` on every row)
 * and shows one level at a time: tap a section to open its sub-categories,
 * a breadcrumb/back row leads up again. Both leaves and intermediate
 * sections are selectable — in `single` mode a section row drills in and a
 * small "select this section" pill picks the section itself; in `multi`
 * mode the row toggles the checkbox and a chevron drills in.
 *
 * With a `query` the tree collapses into a flat search result labelled by
 * the full path ("Dizayn › Logotip").
 */
const props = withDefaults(defineProps<{
  categories: Category[]
  mode?: 'single' | 'multi'
  /** Single mode: the picked id. */
  selectedId?: number | null
  /** Search text — non-empty switches to a flat filtered list. */
  query?: string
  /** Badge shown on the catch-all "Other" row (e.g. "Everyone"). */
  otherBadge?: string
}>(), {
  mode: 'single',
  selectedId: null,
  query: '',
  otherBadge: '',
})

const emit = defineEmits<{
  /** Single mode: a category was picked. */
  select: [id: number]
}>()

/** Multi mode: the selected ids. */
const selectedIds = defineModel<number[]>({ default: () => [] })

const locale = useLocaleStore()
const { haptic } = useTelegram()

const currentId = ref<number | null>(null)
const direction = ref<'in' | 'out'>('in')

const byId = computed(() => new Map(props.categories.map(category => [category.id, category])))

const childrenOf = computed(() => {
  const map = new Map<number | null, Category[]>()
  for (const category of props.categories) {
    const parent = category.parent_id ?? null
    const list = map.get(parent) ?? []
    list.push(category)
    map.set(parent, list)
  }
  // The catch-all always closes a level, whatever the backend order.
  for (const [key, list] of map) {
    map.set(key, [...list.filter(c => !c.is_other), ...list.filter(c => c.is_other)])
  }
  return map
})

/** Ids of every node below the given one (any depth). */
function descendantIds(id: number): number[] {
  const out: number[] = []
  const walk = (parent: number) => {
    for (const child of childrenOf.value.get(parent) ?? []) {
      out.push(child.id)
      walk(child.id)
    }
  }
  walk(id)
  return out
}

const current = computed(() => (currentId.value === null ? null : byId.value.get(currentId.value) ?? null))

/** Root → current, for the breadcrumb. */
const trail = computed<Category[]>(() => {
  const out: Category[] = []
  let node = current.value
  while (node) {
    out.unshift(node)
    node = node.parent_id != null ? byId.value.get(node.parent_id) ?? null : null
  }
  return out
})

const normalizedQuery = computed(() => props.query.trim().toLowerCase())
const searching = computed(() => normalizedQuery.value !== '')

const rows = computed<Category[]>(() => {
  if (searching.value) {
    const list = props.categories.filter(category =>
      category.name_uz.toLowerCase().includes(normalizedQuery.value)
      || category.name_ru.toLowerCase().includes(normalizedQuery.value)
      || (category.full_name_uz ?? '').toLowerCase().includes(normalizedQuery.value)
      || (category.full_name_ru ?? '').toLowerCase().includes(normalizedQuery.value),
    )
    return [...list.filter(c => !c.is_other), ...list.filter(c => c.is_other)]
  }
  return childrenOf.value.get(currentId.value) ?? []
})

// If the current section vanishes (list reloaded), fall back to the root.
watch(() => props.categories, () => {
  if (currentId.value !== null && !byId.value.has(currentId.value)) currentId.value = null
})

function hasChildren(category: Category): boolean {
  return (childrenOf.value.get(category.id)?.length ?? 0) > 0
}

function childrenCount(category: Category): number {
  return childrenOf.value.get(category.id)?.length ?? 0
}

function isSelected(id: number): boolean {
  return props.mode === 'single' ? props.selectedId === id : selectedIds.value.includes(id)
}

/** Multi mode: how many picks sit inside this section (not counting itself). */
function selectedInside(category: Category): number {
  if (props.mode !== 'multi') return 0
  const inside = new Set(descendantIds(category.id))
  return selectedIds.value.filter(id => inside.has(id)).length
}

function label(category: Category): string {
  return searching.value ? categoryFullName(category, locale.locale) : categoryName(category, locale.locale)
}

function drillIn(category: Category) {
  haptic('light')
  direction.value = 'in'
  currentId.value = category.id
}

function goUp() {
  haptic('light')
  direction.value = 'out'
  currentId.value = current.value?.parent_id ?? null
}

function goTo(id: number | null) {
  haptic('light')
  direction.value = 'out'
  currentId.value = id
}

function pick(category: Category) {
  haptic('light')
  if (props.mode === 'single') {
    emit('select', category.id)
    return
  }
  const next = [...selectedIds.value]
  const index = next.indexOf(category.id)
  if (index === -1) next.push(category.id)
  else next.splice(index, 1)
  selectedIds.value = next
}

/** Row tap: single mode drills into sections, otherwise picks/toggles. */
function onRowTap(category: Category) {
  if (props.mode === 'single' && hasChildren(category) && !searching.value) {
    drillIn(category)
    return
  }
  pick(category)
}

function fillCount(template: string, count: number): string {
  return template.replace('{count}', String(count))
}
</script>

<template>
  <div class="ctp">
    <!-- Breadcrumb / back row (hidden at the root and while searching) -->
    <div
      v-if="current && !searching"
      class="ctp__crumbs"
    >
      <button
        type="button"
        class="ctp__back pressable"
        :aria-label="locale.t.common.back"
        @click="goUp"
      >
        <ChevronLeft class="size-5" />
      </button>
      <nav
        class="ctp__trail"
        aria-label="breadcrumb"
      >
        <button
          type="button"
          class="ctp__crumb"
          @click="goTo(null)"
        >
          {{ locale.t.ui.categoryRoot }}
        </button>
        <template
          v-for="node in trail"
          :key="node.id"
        >
          <span
            class="ctp__sep"
            aria-hidden="true"
          >›</span>
          <button
            type="button"
            class="ctp__crumb"
            :class="node.id === current.id && 'ctp__crumb--current'"
            :aria-current="node.id === current.id ? 'location' : undefined"
            @click="node.id !== current.id && goTo(node.id)"
          >
            {{ categoryName(node, locale.locale) }}
          </button>
        </template>
      </nav>
    </div>

    <!-- Single mode: the open section can itself be picked -->
    <button
      v-if="current && !searching && mode === 'single'"
      type="button"
      class="ctp__self pressable"
      :class="isSelected(current.id) && 'ctp__self--selected'"
      @click="pick(current)"
    >
      <span class="ctp__self-label">
        <span class="ctp__self-name">{{ categoryName(current, locale.locale) }}</span>
        <span class="ctp__self-hint">{{ locale.t.ui.categorySelectThis }}</span>
      </span>
      <span
        class="ctp__check"
        :class="isSelected(current.id) && 'ctp__check--on'"
        aria-hidden="true"
      >
        <Check class="size-3.5" />
      </span>
    </button>

    <Transition
      :name="direction === 'in' ? 'ctp-in' : 'ctp-out'"
      mode="out-in"
    >
      <ul
        :key="searching ? 'search' : String(currentId)"
        class="ctp__list"
      >
        <li
          v-for="category in rows"
          :key="category.id"
          class="ctp__row"
          :class="isSelected(category.id) && 'ctp__row--selected'"
        >
          <button
            type="button"
            class="ctp__main pressable"
            :aria-pressed="mode === 'multi' ? isSelected(category.id) : undefined"
            @click="onRowTap(category)"
          >
            <span class="ctp__text">
              <span class="ctp__name">{{ label(category) }}</span>
              <span
                v-if="!searching && hasChildren(category)"
                class="ctp__meta"
              >
                {{ fillCount(locale.t.ui.categoryChildren, childrenCount(category)) }}
                <template v-if="selectedInside(category) > 0">
                  · {{ fillCount(locale.t.ui.categorySelectedInside, selectedInside(category)) }}
                </template>
              </span>
            </span>

            <span
              v-if="category.is_other && otherBadge"
              class="ctp__badge"
            >{{ otherBadge }}</span>

            <!-- Single: leaves / search rows show a check when picked; sections show a chevron -->
            <template v-if="mode === 'single'">
              <ChevronRight
                v-if="!searching && hasChildren(category)"
                class="ctp__chevron"
                aria-hidden="true"
              />
              <span
                v-else-if="isSelected(category.id)"
                class="ctp__check ctp__check--on"
                aria-hidden="true"
              >
                <Check class="size-3.5" />
              </span>
            </template>

            <!-- Multi: checkbox on every row -->
            <span
              v-else
              class="ctp__check"
              :class="isSelected(category.id) && 'ctp__check--on'"
              aria-hidden="true"
            >
              <Check
                v-if="isSelected(category.id)"
                class="size-3.5"
              />
            </span>
          </button>

          <!-- Multi: a separate drill-in control so the row itself toggles -->
          <button
            v-if="mode === 'multi' && !searching && hasChildren(category)"
            type="button"
            class="ctp__drill pressable"
            :aria-label="locale.t.ui.categoryOpen"
            @click="drillIn(category)"
          >
            <ChevronRight class="size-5" />
          </button>
        </li>
      </ul>
    </Transition>

    <p
      v-if="rows.length === 0"
      class="ctp__empty"
    >
      {{ locale.t.ui.categorySearchEmpty }}
    </p>
  </div>
</template>

<style scoped>
.ctp { display: flex; flex-direction: column; gap: 6px; }
/* No synthesized follow-up click on the freshly rendered level after a tap. */
.ctp button { touch-action: manipulation; }

.ctp__crumbs {
  display: flex; align-items: center; gap: 6px; min-height: 44px; padding: 2px 0;
}
.ctp__back {
  display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; flex-shrink: 0;
  border: 1px solid var(--border); border-radius: var(--rb-r-chip); background: var(--card);
  color: var(--foreground); box-shadow: var(--rb-elev-1);
}
.ctp__trail {
  display: flex; align-items: center; gap: 4px; min-width: 0; overflow-x: auto; white-space: nowrap;
  font-size: 13px; font-weight: 600; color: var(--muted-foreground); scrollbar-width: none;
}
.ctp__trail::-webkit-scrollbar { display: none; }
.ctp__crumb { padding: 6px 2px; background: none; border: 0; color: inherit; font: inherit; cursor: pointer; }
.ctp__crumb--current { color: var(--primary); }
.ctp__sep { color: var(--muted-foreground); opacity: 0.7; }

.ctp__self {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; min-height: 56px;
  padding: 10px 14px; border: 1.5px dashed color-mix(in oklab, var(--primary) 45%, transparent);
  border-radius: var(--rb-r-field); background: color-mix(in oklab, var(--primary) 6%, var(--card));
  text-align: left; color: var(--foreground); cursor: pointer;
  transition: border-color var(--rb-dur) var(--rb-ease), background-color var(--rb-dur) var(--rb-ease);
}
.ctp__self--selected { border-style: solid; border-color: var(--primary); }
.ctp__self-label { display: flex; flex-direction: column; min-width: 0; }
.ctp__self-name { font-size: 16px; font-weight: 700; }
.ctp__self-hint { font-size: 12px; font-weight: 600; color: var(--primary); }

.ctp__list { margin: 0; padding: 0; list-style: none; }
.ctp__row { display: flex; align-items: stretch; border-bottom: 1px solid color-mix(in oklab, var(--border) 70%, transparent); }
.ctp__row:last-child { border-bottom: 0; }
.ctp__row--selected .ctp__name { color: var(--primary); }

.ctp__main {
  display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; min-height: 54px; padding: 8px 4px;
  border: 0; background: none; text-align: left; color: var(--foreground); cursor: pointer;
}
.ctp__main:active { opacity: 0.55; }
.ctp__text { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 1px; }
.ctp__name { font-size: 17px; font-weight: 500; line-height: 1.25; overflow-wrap: anywhere; }
.ctp__meta { font-size: 12px; font-weight: 600; color: var(--muted-foreground); }
.ctp__badge { flex-shrink: 0; padding: 3px 10px; border-radius: var(--rb-r-chip); background: var(--secondary); color: var(--primary); font-size: 12px; font-weight: 700; }
.ctp__chevron { width: 20px; height: 20px; flex-shrink: 0; color: var(--muted-foreground); }

.ctp__check {
  display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0;
  border: 2px solid var(--border); border-radius: var(--rb-r-chip); background: var(--background); color: transparent;
  transition: background-color var(--rb-dur) var(--rb-ease), border-color var(--rb-dur) var(--rb-ease);
}
.ctp__check--on { border-color: var(--primary); background: var(--primary); color: var(--primary-foreground); }

.ctp__drill {
  display: inline-flex; align-items: center; justify-content: center; width: 48px; flex-shrink: 0;
  border: 0; border-left: 1px solid color-mix(in oklab, var(--border) 70%, transparent); background: none;
  color: var(--primary); cursor: pointer;
}
.ctp__drill:active { opacity: 0.55; }

.ctp__empty { padding: 12px 4px; font-size: 14px; color: var(--muted-foreground); }

.ctp-in-enter-active, .ctp-in-leave-active, .ctp-out-enter-active, .ctp-out-leave-active {
  transition: opacity var(--rb-dur) var(--rb-ease), transform var(--rb-dur) var(--rb-ease);
}
.ctp-in-enter-from { opacity: 0; transform: translateX(18px); }
.ctp-in-leave-to { opacity: 0; transform: translateX(-18px); }
.ctp-out-enter-from { opacity: 0; transform: translateX(-18px); }
.ctp-out-leave-to { opacity: 0; transform: translateX(18px); }

@media (prefers-reduced-motion: reduce) {
  .ctp-in-enter-active, .ctp-in-leave-active, .ctp-out-enter-active, .ctp-out-leave-active { transition: none; }
  .ctp-in-enter-from, .ctp-in-leave-to, .ctp-out-enter-from, .ctp-out-leave-to { transform: none; }
}

.ctp__back:focus-visible, .ctp__crumb:focus-visible, .ctp__self:focus-visible, .ctp__main:focus-visible, .ctp__drill:focus-visible {
  outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 8px;
}
</style>
