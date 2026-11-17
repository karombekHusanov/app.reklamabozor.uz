<script setup lang="ts">
import {
  Award,
  Briefcase,
  Check,
  ChevronRight,
  Image as ImageIcon,
  LayoutGrid,
  ListOrdered,
  Lock,
  MapPin,
  TrendingUp,
} from '@lucide/vue'
import { computed, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { categoryName } from '@/core/i18n/category-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { AgentProfile } from '@/modules/agent/types/agent'
import {
  editSectionPath,
  FILLABLE_SECTIONS,
  isSectionFilled,
  REQUIRED_SECTIONS,
  type EditSection,
  type FillableSection,
} from '@/modules/profile/lib/edit-sections'

const props = defineProps<{
  profile: AgentProfile
}>()

const locale = useLocaleStore()
const router = useRouter()

const t = computed(() => locale.t.profileEdit)

const percent = computed(() => Math.max(0, Math.min(100, Math.round(props.profile.completion_percent ?? 0))))
const RING_C = 2 * Math.PI * 30
const ringDash = computed(() => `${(percent.value / 100) * RING_C} ${RING_C}`)

const remaining = computed(() =>
  FILLABLE_SECTIONS.filter(section => !isSectionFilled(props.profile, section)).length,
)

function fmt(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, String(value)), template)
}

interface Row {
  key: EditSection
  icon: Component
  title: string
  summary: string
  /** null = no status chip (requisites). */
  filled: boolean | null
  required: boolean
}

function summaryFor(section: FillableSection): string {
  const p = props.profile
  const filled = isSectionFilled(p, section)
  switch (section) {
    case 'brand':
      return filled ? t.value.brandSub : t.value.brandEmpty
    case 'categories': {
      if (!filled) return t.value.categoriesEmpty
      const names = p.categories.map(c => categoryName(c, locale.locale))
      const head = names.slice(0, 2).join(', ')
      return names.length > 2 ? `${head} ${fmt(t.value.categoriesMore, { count: names.length - 2 })}` : head
    }
    case 'location':
      return filled ? (p.location_label?.trim() || t.value.location) : t.value.locationEmpty
    case 'portfolio':
      return filled ? fmt(t.value.portfolioCount, { count: p.portfolio.length }) : t.value.portfolioEmpty
    case 'results':
      return filled ? t.value.resultsFilled : t.value.resultsEmpty
    case 'advantages':
      return filled ? fmt(t.value.advantagesCount, { count: p.advantages.length }) : t.value.advantagesEmpty
    case 'workflow':
      return filled ? fmt(t.value.workflowCount, { count: p.workflow_steps.length }) : t.value.workflowEmpty
  }
}

const ICONS: Record<EditSection, Component> = {
  brand: ImageIcon,
  categories: LayoutGrid,
  location: MapPin,
  portfolio: Briefcase,
  results: TrendingUp,
  advantages: Award,
  workflow: ListOrdered,
  requisites: Lock,
}

function row(section: FillableSection): Row {
  return {
    key: section,
    icon: ICONS[section],
    title: t.value[section],
    summary: summaryFor(section),
    filled: isSectionFilled(props.profile, section),
    required: REQUIRED_SECTIONS.includes(section),
  }
}

const groups = computed(() => [
  {
    key: 'visible',
    label: t.value.groupVisible,
    note: t.value.requiredNote,
    rows: (['brand', 'categories', 'location'] as FillableSection[]).map(row),
  },
  {
    key: 'trust',
    label: t.value.groupTrust,
    note: null,
    rows: (['portfolio', 'results', 'advantages', 'workflow'] as FillableSection[]).map(row),
  },
  {
    key: 'requisites',
    label: t.value.groupRequisites,
    note: null,
    rows: [{
      key: 'requisites' as const,
      icon: ICONS.requisites,
      title: t.value.requisites,
      summary: t.value.requisitesSub,
      filled: null,
      required: false,
    }] satisfies Row[],
  },
])

function open(section: EditSection) {
  void router.push(editSectionPath(section))
}
</script>

<template>
  <div class="aeh">
    <section class="aeh-card aeh-progress">
      <div
        class="aeh-ring"
        role="img"
        :aria-label="fmt(t.ringLabel, { percent })"
      >
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          aria-hidden="true"
        >
          <circle
            cx="36"
            cy="36"
            r="30"
            class="aeh-ring__track"
          />
          <circle
            cx="36"
            cy="36"
            r="30"
            class="aeh-ring__fill"
            :stroke-dasharray="ringDash"
            transform="rotate(-90 36 36)"
          />
        </svg>
        <span class="aeh-ring__value">{{ percent }}%</span>
      </div>
      <div class="min-w-0 space-y-1">
        <p class="aeh-progress__title">
          {{ remaining > 0 ? fmt(t.remaining, { count: remaining }) : t.allDone }}
        </p>
        <p class="aeh-progress__body">
          {{ t.hubIntro }}
        </p>
      </div>
    </section>

    <div
      v-for="group in groups"
      :key="group.key"
    >
      <h2 class="aeh-label">
        {{ group.label }}
      </h2>
      <nav class="aeh-card aeh-list">
        <button
          v-for="item in group.rows"
          :key="item.key"
          type="button"
          class="aeh-row pressable"
          @click="open(item.key)"
        >
          <span
            class="aeh-row__ic"
            :class="{
              'aeh-row__ic--todo': item.filled === false,
              'aeh-row__ic--locked': item.filled === null,
            }"
          >
            <component
              :is="item.icon"
              class="size-[18px]"
            />
          </span>
          <span class="aeh-row__body">
            <span class="aeh-row__title">{{ item.title }}</span>
            <span class="aeh-row__sub">{{ item.summary }}</span>
          </span>
          <span
            v-if="item.filled === true"
            class="aeh-ok"
            :aria-label="t.statusDone"
          >
            <Check
              class="size-3"
              :stroke-width="3"
            />
          </span>
          <span
            v-else-if="item.filled === false"
            class="aeh-todo"
            :class="{ 'aeh-todo--required': item.required }"
          >
            {{ item.required ? t.statusRequired : t.statusTodo }}
          </span>
          <ChevronRight
            class="aeh-row__chev"
            aria-hidden="true"
          />
        </button>
      </nav>
      <p
        v-if="group.note"
        class="aeh-note"
      >
        {{ group.note }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.aeh { display: flex; flex-direction: column; gap: 18px; }
.aeh-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--rb-r-card); box-shadow: var(--rb-elev-1); }
.aeh-progress { display: flex; align-items: center; gap: 16px; padding: 16px; }
.aeh-progress__title { margin: 0; font-size: 15px; font-weight: 700; color: var(--foreground); }
.aeh-progress__body { margin: 0; font-size: 13px; line-height: 1.4; color: var(--muted-foreground); }
.aeh-ring { position: relative; width: 72px; height: 72px; flex-shrink: 0; }
.aeh-ring__track { fill: none; stroke: var(--secondary); stroke-width: 8; }
.aeh-ring__fill { fill: none; stroke: var(--primary); stroke-width: 8; stroke-linecap: round; transition: stroke-dasharray var(--rb-dur-slow) var(--rb-ease); }
.aeh-ring__value { position: absolute; inset: 0; display: grid; place-items: center; font-family: var(--rb-font-display); font-size: 18px; font-weight: 900; color: var(--foreground); }

.aeh-label { margin: 0 6px 8px; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--muted-foreground); }
.aeh-list { overflow: hidden; }
.aeh-row {
  display: flex; align-items: center; gap: 12px; width: 100%; min-height: 64px; padding: 12px 14px;
  background: transparent; border: 0; border-top: 1px solid var(--border); text-align: left; color: var(--foreground); cursor: pointer;
}
.aeh-row:first-child { border-top: 0; }
.aeh-row:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
.aeh-row__ic { display: grid; place-items: center; width: 36px; height: 36px; flex-shrink: 0; border-radius: var(--rb-r-icon); background: var(--secondary); color: var(--primary); }
.aeh-row__ic--todo { background: color-mix(in srgb, var(--rb-cta) 12%, transparent); color: var(--rb-cta-strong); }
.aeh-row__ic--locked { background: var(--muted); color: var(--muted-foreground); }
.aeh-row__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.aeh-row__title { font-size: 14px; font-weight: 600; line-height: 1.25; }
.aeh-row__sub { font-size: 12px; line-height: 1.3; color: var(--muted-foreground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aeh-row__chev { width: 16px; height: 16px; flex-shrink: 0; color: var(--muted-foreground); opacity: .6; }
.aeh-ok { display: grid; place-items: center; width: 22px; height: 22px; flex-shrink: 0; border-radius: 999px; background: rgb(16 185 129 / .15); color: rgb(5 150 105); }
.aeh-todo {
  display: inline-flex; align-items: center; height: 24px; padding: 0 9px; flex-shrink: 0; border-radius: 999px; white-space: nowrap;
  background: color-mix(in srgb, var(--rb-cta) 12%, transparent); color: var(--rb-cta-strong); font-size: 12px; font-weight: 700;
}
.aeh-todo--required { background: var(--rb-cta); color: var(--rb-on-cta); }
.aeh-note { margin: 8px 6px 0; font-size: 12px; line-height: 1.4; color: var(--muted-foreground); }
</style>
