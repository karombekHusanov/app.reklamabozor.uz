<script setup lang="ts">
import { ROUTES } from '@/modules/shell/constants/routes'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { Home, Map, Plus, Sparkles, User } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { haptic } = useTelegram()
const locale = useLocaleStore()

const tabs = computed(() => [
  { key: 'home', to: ROUTES.home, label: locale.t.shell.tabs.home, icon: Home, fab: false },
  { key: 'map', to: ROUTES.map, label: locale.t.shell.tabs.map, icon: Map, fab: false },
  { key: 'create', to: ROUTES.newOrder, label: locale.t.shell.tabs.create, icon: Plus, fab: true },
  { key: 'assistant', to: ROUTES.assistant, label: locale.t.shell.tabs.assistant, icon: Sparkles, fab: false },
  { key: 'profile', to: ROUTES.profile, label: locale.t.shell.tabs.profile, icon: User, fab: false },
])

/**
 * Left side · Create · right side. Each side spreads its tabs evenly in its own
 * half, so the Create button stays centred and the gaps between labels stay
 * even even though label widths differ ("Profil" vs "AI yordamchi").
 */
const groups = computed(() => {
  const all = tabs.value
  const fab = all.findIndex(t => t.fab)
  return [
    { key: 'left', side: true, items: all.slice(0, fab) },
    { key: 'fab', side: false, items: all.slice(fab, fab + 1) },
    { key: 'right', side: true, items: all.slice(fab + 1) },
  ]
})

function isActive(to: string): boolean {
  const path = route.path
  if (to === ROUTES.home) return path === ROUTES.home
  if (to === ROUTES.newOrder) return path === ROUTES.newOrder
  if (to === ROUTES.assistant) return path === ROUTES.assistant
  if (to === ROUTES.profile) return path === ROUTES.profile
  return path === to || path.startsWith(`${to}/`)
}

function navigate(to: string) {
  if (isActive(to)) return
  haptic(to === ROUTES.newOrder ? 'medium' : 'light')
  // The order page itself shows Tender locked / Tezkor open for accounts
  // without tender access — no redirect here.
  void router.push(to)
}

/* ── Bar silhouette ───────────────────────────────────────────────
   The top edge eases into a cradle around the Create button instead of
   running behind it: straight edge → convex fillet → concave cradle →
   fillet → straight edge, every junction tangent-continuous, so the
   outline never shows a corner. Drawn as one path and reused for the
   fill, the hairline and the backdrop-blur clip. */
const CORNER = 24
const CRADLE_GAP = 6
const FILLET = 13

const barRef = ref<HTMLElement | null>(null)
const size = ref({ w: 0, h: 0 })
const cradle = ref({ cx: 0, cy: 0, r: 0 })
const clipId = `tabbar-cradle-${useId()}`

function measure() {
  const bar = barRef.value
  const fab = bar?.querySelector<HTMLElement>('.fab')
  if (!bar || !fab) return

  const barBox = bar.getBoundingClientRect()
  const fabBox = fab.getBoundingClientRect()
  if (barBox.width === 0) return

  size.value = { w: barBox.width, h: barBox.height }
  cradle.value = {
    cx: fabBox.left + fabBox.width / 2 - barBox.left,
    cy: fabBox.top + fabBox.height / 2 - barBox.top,
    r: fabBox.width / 2 + CRADLE_GAP,
  }
}

let observer: ResizeObserver | null = null

onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  if (barRef.value) observer.observe(barRef.value)
  window.addEventListener('resize', measure)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', measure)
})

/** Rounded rectangle whose top edge dips around the Create button. */
const shapePath = computed(() => {
  const { w, h } = size.value
  if (w === 0) return ''

  const { cx, cy, r } = cradle.value
  const c = CORNER

  // No cradle needed when the button clears the bar entirely.
  if (r <= 0 || cy - r >= 0 || cy + r <= 0) {
    return `M ${c} 0 H ${w - c} A ${c} ${c} 0 0 1 ${w} ${c} V ${h - c}`
      + ` A ${c} ${c} 0 0 1 ${w - c} ${h} H ${c}`
      + ` A ${c} ${c} 0 0 1 0 ${h - c} V ${c} A ${c} ${c} 0 0 1 ${c} 0 Z`
  }

  // Fillet circles sit on the top edge and touch the cradle from outside.
  const f = FILLET
  const dx = Math.sqrt(Math.max((r + f) ** 2 - (f - cy) ** 2, 0))
  // Where fillet meets cradle: along the line joining their centres.
  const t = f / (r + f)
  const jx = cx - dx + (cx - (cx - dx)) * t
  const jy = f + (cy - f) * t

  return [
    `M ${c} 0`,
    `H ${(cx - dx).toFixed(2)}`,
    `A ${f} ${f} 0 0 1 ${jx.toFixed(2)} ${jy.toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 0 ${(2 * cx - jx).toFixed(2)} ${jy.toFixed(2)}`,
    `A ${f} ${f} 0 0 1 ${(cx + dx).toFixed(2)} 0`,
    `H ${w - c}`,
    `A ${c} ${c} 0 0 1 ${w} ${c}`,
    `V ${h - c}`,
    `A ${c} ${c} 0 0 1 ${w - c} ${h}`,
    `H ${c}`,
    `A ${c} ${c} 0 0 1 0 ${h - c}`,
    `V ${c}`,
    `A ${c} ${c} 0 0 1 ${c} 0`,
    'Z',
  ].join(' ')
})
</script>

<template>
  <nav
    class="tab-bar-dock"
    aria-label="Main navigation"
  >
    <div
      ref="barRef"
      class="tabbar"
    >
      <!-- Silhouette: fill + hairline, and the same path clips the blur layer. -->
      <svg
        class="tabbar__shape"
        :viewBox="`0 0 ${size.w} ${size.h}`"
        :width="size.w"
        :height="size.h"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <clipPath :id="clipId">
            <path :d="shapePath" />
          </clipPath>
        </defs>
        <path
          class="tabbar__fill"
          :d="shapePath"
        />
      </svg>
      <span
        class="tabbar__blur"
        :style="{ clipPath: `url(#${clipId})` }"
        aria-hidden="true"
      />

      <div
        v-for="group in groups"
        :key="group.key"
        class="tabbar__group"
        :class="group.side ? 'tabbar__group--side' : 'tabbar__group--fab'"
      >
        <button
          v-for="tab in group.items"
          :key="tab.key"
          type="button"
          class="tab"
          :class="{ 'tab--active': isActive(tab.to), 'tab--fab': tab.fab }"
          :aria-current="isActive(tab.to) ? 'page' : undefined"
          @click="navigate(tab.to)"
        >
          <template v-if="tab.fab">
            <span class="fab">
              <component
                :is="tab.icon"
                class="size-7"
                :stroke-width="2.4"
              />
            </span>
            <span class="tab__lbl tab__lbl--fab">{{ tab.label }}</span>
          </template>
          <template v-else>
            <component
              :is="tab.icon"
              class="tab__ic"
              :stroke-width="isActive(tab.to) ? 2.35 : 2"
            />
            <span class="tab__lbl">{{ tab.label }}</span>
          </template>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Page content scrolls under the floating dock — fade it out beneath. */
.tab-bar-dock::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 116px;
  background: linear-gradient(to top, var(--background) 48%, color-mix(in srgb, var(--background) 62%, transparent) 76%, transparent);
  pointer-events: none;
}

.tabbar {
  pointer-events: auto;
  position: relative;
  z-index: 1;
  width: min(100% - 1.25rem, 30rem);
  margin-bottom: max(env(safe-area-inset-bottom), 0.625rem);
  display: grid;
  /* Equal halves around Create — minmax(0, …) so a long label can't widen one side. */
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: end;
  gap: 0;
  padding: 9px 10px 10px;
}
.tabbar__group {
  position: relative;
  z-index: 1;
  min-width: 0;
  display: flex;
  align-items: flex-end;
}
.tabbar__group--side {
  justify-content: space-evenly;
}
.tabbar__group--side .tab {
  flex: 0 1 auto;
  min-width: 0;
  /* Lay out by label width (even gaps), but keep a ≥44px tap target. */
  padding-inline: 12px;
  margin-inline: -12px;
}

.dark .tabbar__shape {
  filter: drop-shadow(0 16px 20px rgba(0, 0, 0, 0.55)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
}

/* Fill + hairline, both following the cradle path. */
.tabbar__shape {
  position: absolute;
  inset: 0;
  z-index: -2;
  overflow: visible;
  pointer-events: none;
  filter: drop-shadow(0 14px 20px rgba(2, 48, 92, 0.16)) drop-shadow(0 2px 6px rgba(2, 48, 92, 0.09));
}

.tabbar__fill {
  fill: color-mix(in srgb, var(--card) 88%, transparent);
  stroke: color-mix(in srgb, var(--border) 80%, transparent);
  stroke-width: 1;
}

/* Backdrop blur clipped to the same silhouette. */
.tabbar__blur {
  position: absolute;
  inset: 0;
  z-index: -3;
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  pointer-events: none;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: 0;
  cursor: pointer;
  padding: 4px 0;
  color: var(--muted-foreground);
  font-family: inherit;
  font-size: 9px;
  font-weight: 500;
  transition: color var(--rb-dur) var(--rb-ease);
  -webkit-tap-highlight-color: transparent;
}
.tab--active { color: var(--primary); }
.tab:active { opacity: 0.85; }
.tab:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 12px; }

.tab__ic {
  width: 22px;
  height: 22px;
  color: var(--muted-foreground);
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: color var(--rb-dur) var(--rb-ease);
}
.tab--active .tab__ic { color: var(--primary); }

.tab__lbl {
  max-width: 100%;
  line-height: 1;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tab--active .tab__lbl { font-weight: 600; }

/* raised coral FAB (Create) */
.tab--fab {
  position: relative;
  /* Height of the button above this column's baseline — the cradle is derived
     from the button's real position, so this alone controls how deep the bar's
     top edge dips. */
  --fab-lift: 28px;
}
.tab--fab .fab {
  position: absolute;
  left: 50%;
  bottom: var(--fab-lift);
  width: 62px;
  height: 62px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--rb-cta) 0%, var(--rb-cta-strong) 100%);
  color: #fff;
  display: grid;
  place-items: center;
  box-shadow: var(--rb-elev-cta);
  transform: translateX(-50%);
  transition: transform .14s ease;
}
.tab--fab:active .fab { transform: translateX(-50%) scale(0.92); }
/* The FAB label is wider than its grid column — let it overflow evenly rather than clip. */
.tab__lbl--fab {
  max-width: none;
  overflow: visible;
  text-overflow: clip;
  color: var(--rb-cta);
  font-weight: 600;
  margin-top: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .tab, .tab__ic, .tab--fab .fab { transition: none; }
  .tab--fab:active .fab { transform: translateX(-50%); }
}
</style>
