<script setup lang="ts">
import { computed, type Component } from 'vue'
import { ChevronRight } from '@lucide/vue'

export type HomeActionTone = 'sky' | 'amber' | 'violet' | 'emerald' | 'teal' | 'indigo'

export interface HomeActionItem {
  key: string
  label: string
  description: string
  icon: Component
  tone: HomeActionTone
  count?: number
  pulse?: boolean
  /** Corner ribbon, e.g. "Soon". */
  tag?: string
}

const props = withDefaults(defineProps<{
  actions: HomeActionItem[]
  /** priority = featured + row; bento = full hero + 2-up + 3-up. */
  layout?: 'priority' | 'grid'
  ariaLabel?: string
}>(), {
  layout: 'priority',
  ariaLabel: 'Quick actions',
})

const emit = defineEmits<{
  action: [key: string]
}>()

/** priority: first full-width when 3+ items. */
const featured = computed(() => {
  if (props.layout !== 'priority') return null
  return props.actions.length >= 3 ? (props.actions[0] ?? null) : null
})

const secondary = computed(() => {
  if (props.layout === 'grid') return []
  return props.actions.length >= 3 ? props.actions.slice(1) : props.actions
})

/** bento: hero (1) → pair (2) → trio (rest, typically 3). */
const bentoHero = computed(() =>
  props.layout === 'grid' ? (props.actions[0] ?? null) : null,
)
const bentoPair = computed(() =>
  props.layout === 'grid' ? props.actions.slice(1, 3) : [],
)
const bentoTrio = computed(() =>
  props.layout === 'grid' ? props.actions.slice(3) : [],
)

function formatCount(count: number): string {
  if (count > 99) return '99+'
  return String(count)
}

function actionAria(action: HomeActionItem): string {
  if (action.count && action.count > 0) return `${action.label}: ${action.count}`
  return action.label
}
</script>

<template>
  <section
    v-if="actions.length"
    class="home-action-dock"
    :class="{ 'home-action-dock--bento': layout === 'grid' }"
    role="navigation"
    :aria-label="ariaLabel"
  >
    <!-- ── priority layout ───────────────────────────────────────── -->
    <button
      v-if="featured"
      type="button"
      class="home-action-glass home-action-glass--featured pressable"
      :class="[
        `home-action-glass--${featured.tone}`,
        featured.count && featured.count > 0 && 'home-action-glass--active',
        featured.pulse && 'home-action-glass--pulse',
      ]"
      :aria-label="actionAria(featured)"
      @click="emit('action', featured.key)"
    >
      <span
        class="home-action-glass__shine"
        aria-hidden="true"
      />
      <span
        class="home-action-glass__orb"
        aria-hidden="true"
      />
      <span
        v-if="featured.tag"
        class="home-action-glass__tag"
      >{{ featured.tag }}</span>
      <span
        class="home-action-glass__icon"
        aria-hidden="true"
      >
        <component
          :is="featured.icon"
          class="size-5"
          :stroke-width="2.25"
        />
      </span>
      <span class="home-action-glass__body">
        <span class="home-action-glass__label">{{ featured.label }}</span>
        <span class="home-action-glass__desc">{{ featured.description }}</span>
      </span>
      <span
        v-if="featured.count && featured.count > 0"
        class="home-action-glass__pill"
      >
        {{ formatCount(featured.count) }}
      </span>
      <ChevronRight
        class="home-action-glass__chevron"
        aria-hidden="true"
      />
    </button>

    <div
      v-if="secondary.length"
      class="home-action-dock__row"
    >
      <button
        v-for="action in secondary"
        :key="action.key"
        type="button"
        class="home-action-glass home-action-glass--compact pressable"
        :class="[
          `home-action-glass--${action.tone}`,
          action.count && action.count > 0 && 'home-action-glass--active',
          action.pulse && 'home-action-glass--pulse',
        ]"
        :aria-label="actionAria(action)"
        @click="emit('action', action.key)"
      >
        <span
          class="home-action-glass__shine"
          aria-hidden="true"
        />
        <span
          class="home-action-glass__orb"
          aria-hidden="true"
        />
        <span
          v-if="action.tag"
          class="home-action-glass__tag"
        >{{ action.tag }}</span>
        <span class="home-action-glass__top">
          <span
            class="home-action-glass__icon"
            aria-hidden="true"
          >
            <component
              :is="action.icon"
              class="size-[1.125rem]"
              :stroke-width="2.25"
            />
          </span>
          <span
            v-if="action.count && action.count > 0"
            class="home-action-glass__pill"
          >
            {{ formatCount(action.count) }}
          </span>
        </span>
        <span class="home-action-glass__body">
          <span class="home-action-glass__label">{{ action.label }}</span>
          <span class="home-action-glass__desc">{{ action.description }}</span>
        </span>
      </button>
    </div>

    <!-- ── bento layout: full → 2 → 3 ─────────────────────────────── -->
    <template v-if="layout === 'grid'">
      <button
        v-if="bentoHero"
        type="button"
        class="home-action-glass home-action-glass--featured pressable"
        :class="[
          `home-action-glass--${bentoHero.tone}`,
          bentoHero.count && bentoHero.count > 0 && 'home-action-glass--active',
          bentoHero.pulse && 'home-action-glass--pulse',
        ]"
        :aria-label="actionAria(bentoHero)"
        @click="emit('action', bentoHero.key)"
      >
        <span
          class="home-action-glass__shine"
          aria-hidden="true"
        />
        <span
          class="home-action-glass__orb"
          aria-hidden="true"
        />
        <span
          v-if="bentoHero.tag"
          class="home-action-glass__tag"
        >{{ bentoHero.tag }}</span>
        <span
          class="home-action-glass__icon"
          aria-hidden="true"
        >
          <component
            :is="bentoHero.icon"
            class="size-5"
            :stroke-width="2.25"
          />
        </span>
        <span class="home-action-glass__body">
          <span class="home-action-glass__label">{{ bentoHero.label }}</span>
          <span class="home-action-glass__desc">{{ bentoHero.description }}</span>
        </span>
        <span
          v-if="bentoHero.count && bentoHero.count > 0"
          class="home-action-glass__pill"
        >
          {{ formatCount(bentoHero.count) }}
        </span>
        <ChevronRight
          class="home-action-glass__chevron"
          aria-hidden="true"
        />
      </button>

      <div
        v-if="bentoPair.length"
        class="home-action-dock__pair"
      >
        <button
          v-for="(action, index) in bentoPair"
          :key="action.key"
          type="button"
          class="home-action-glass home-action-glass--compact pressable"
          :class="[
            `home-action-glass--${action.tone}`,
            index === 0 && bentoPair.length === 2 && 'home-action-glass--wide',
            action.count && action.count > 0 && 'home-action-glass--active',
            action.pulse && 'home-action-glass--pulse',
          ]"
          :aria-label="actionAria(action)"
          @click="emit('action', action.key)"
        >
          <span
            class="home-action-glass__shine"
            aria-hidden="true"
          />
          <span
            class="home-action-glass__orb"
            aria-hidden="true"
          />
          <span
            v-if="action.tag"
            class="home-action-glass__tag"
          >{{ action.tag }}</span>
          <span class="home-action-glass__top">
            <span
              class="home-action-glass__icon"
              aria-hidden="true"
            >
              <component
                :is="action.icon"
                class="size-[1.125rem]"
                :stroke-width="2.25"
              />
            </span>
            <span
              v-if="action.count && action.count > 0"
              class="home-action-glass__pill"
            >
              {{ formatCount(action.count) }}
            </span>
          </span>
          <span class="home-action-glass__body">
            <span class="home-action-glass__label">{{ action.label }}</span>
            <span class="home-action-glass__desc">{{ action.description }}</span>
          </span>
        </button>
      </div>

      <div
        v-if="bentoTrio.length"
        class="home-action-dock__trio"
      >
        <button
          v-for="action in bentoTrio"
          :key="action.key"
          type="button"
          class="home-action-glass home-action-glass--dense pressable"
          :class="[
            `home-action-glass--${action.tone}`,
            action.count && action.count > 0 && 'home-action-glass--active',
            action.pulse && 'home-action-glass--pulse',
          ]"
          :aria-label="actionAria(action)"
          @click="emit('action', action.key)"
        >
          <span
            class="home-action-glass__shine"
            aria-hidden="true"
          />
          <span
            class="home-action-glass__orb home-action-glass__orb--sm"
            aria-hidden="true"
          />
          <span
            v-if="action.tag"
            class="home-action-glass__tag"
          >{{ action.tag }}</span>
          <span
            class="home-action-glass__icon"
            aria-hidden="true"
          >
            <component
              :is="action.icon"
              class="size-4"
              :stroke-width="2.25"
            />
          </span>
          <span class="home-action-glass__label">{{ action.label }}</span>
        </button>
      </div>
    </template>
  </section>
</template>
