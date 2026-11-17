<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'

/**
 * Full-width map entry on the client home (replaces the top-bar map button):
 * an illustrated city map showing the three layers — agencies, LED screens and
 * metro — each chip opening the map on its own layer.
 */
type Layer = 'agencies' | 'screens' | 'metro'

const router = useRouter()
const locale = useLocaleStore()
const { haptic } = useTelegram()

const t = computed(() => locale.t.clientHome.mapPromo)
const chips = computed<{ layer: Layer, label: string }[]>(() => [
  { layer: 'agencies', label: t.value.agencies },
  { layer: 'screens', label: t.value.screens },
  { layer: 'metro', label: t.value.metro },
])

function open(layer: Layer = 'agencies') {
  haptic('light')
  void router.push(layer === 'agencies' ? ROUTES.map : { path: ROUTES.map, query: { layer } })
}
</script>

<template>
  <section class="cmp">
    <button
      type="button"
      class="cmp__main"
      :aria-label="t.open"
      @click="open()"
    >
      <span class="cmp__art">
        <svg
          viewBox="0 0 360 150"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <!-- city ground + blocks -->
          <rect
            width="360"
            height="150"
            class="m-ground"
          />
          <g class="m-block">
            <rect
              x="8"
              y="8"
              width="70"
              height="38"
              rx="6"
            />
            <rect
              x="92"
              y="8"
              width="58"
              height="38"
              rx="6"
            />
            <rect
              x="8"
              y="60"
              width="44"
              height="40"
              rx="6"
            />
            <rect
              x="8"
              y="114"
              width="70"
              height="30"
              rx="6"
            />
            <rect
              x="166"
              y="8"
              width="64"
              height="30"
              rx="6"
            />
            <rect
              x="244"
              y="8"
              width="52"
              height="44"
              rx="6"
            />
            <rect
              x="310"
              y="8"
              width="44"
              height="44"
              rx="6"
            />
            <rect
              x="214"
              y="64"
              width="40"
              height="34"
              rx="6"
            />
            <rect
              x="268"
              y="66"
              width="86"
              height="32"
              rx="6"
            />
            <rect
              x="166"
              y="112"
              width="60"
              height="32"
              rx="6"
            />
            <rect
              x="240"
              y="112"
              width="114"
              height="32"
              rx="6"
            />
          </g>
          <!-- park + canal -->
          <rect
            x="66"
            y="60"
            width="84"
            height="40"
            rx="10"
            class="m-park"
          />
          <path
            d="M-10 132 C 60 118, 110 150, 160 104 S 250 52, 370 60"
            class="m-water"
          />
          <!-- streets -->
          <g class="m-road">
            <path d="M0 53 H360" />
            <path d="M0 106 H360" />
            <path d="M85 0 V150" />
            <path d="M159 0 V150" />
            <path d="M237 0 V150" />
          </g>
          <!-- metro lines + stations -->
          <path
            d="M20 150 L85 106 L159 106 L237 53 L300 30"
            class="m-line m-line--red"
          />
          <path
            d="M159 0 L159 53 L237 106 L360 120"
            class="m-line m-line--blue"
          />
          <g class="m-station">
            <circle
              cx="85"
              cy="106"
              r="5"
            />
            <circle
              cx="159"
              cy="106"
              r="5"
            />
            <circle
              cx="237"
              cy="53"
              r="5"
            />
            <circle
              cx="159"
              cy="53"
              r="5"
            />
            <circle
              cx="237"
              cy="106"
              r="5"
            />
          </g>
          <g transform="translate(250 22)">
            <circle
              r="11"
              class="m-metro-badge"
            />
            <text
              y="4.5"
              text-anchor="middle"
              class="m-metro-text"
            >M</text>
          </g>
          <!-- LED screens -->
          <g
            v-for="(s, i) in [[118, 30], [196, 82], [318, 92]]"
            :key="`s${i}`"
            :transform="`translate(${s[0]} ${s[1]})`"
          >
            <rect
              x="-15"
              y="-22"
              width="30"
              height="19"
              rx="3.5"
              class="m-led"
            />
            <rect
              x="-11"
              y="-18"
              width="22"
              height="11"
              rx="1.5"
              class="m-led-glass"
            />
            <path
              d="M0 -3 V6"
              class="m-led-stand"
            />
          </g>
          <!-- agencies -->
          <g
            v-for="(a, i) in [[40, 40], [130, 140], [282, 60], [205, 34]]"
            :key="`a${i}`"
            :transform="`translate(${a[0]} ${a[1]})`"
          >
            <path
              d="M0 0 C -9 -10 -12 -15 -12 -20 A 12 12 0 1 1 12 -20 C 12 -15 9 -10 0 0 Z"
              class="m-pin"
            />
            <circle
              cy="-20"
              r="4.5"
              class="m-pin-dot"
            />
          </g>
        </svg>
      </span>

      <span class="cmp__text">
        <span class="cmp__title">{{ t.title }}</span>
        <span class="cmp__body">{{ t.body }}</span>
      </span>
      <ChevronRight class="cmp__chev size-5" />
    </button>

    <div class="cmp__chips">
      <button
        v-for="chip in chips"
        :key="chip.layer"
        type="button"
        class="cmp__chip"
        @click="open(chip.layer)"
      >
        <span
          class="cmp__dot"
          :class="`cmp__dot--${chip.layer}`"
        />
        {{ chip.label }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.cmp {
  position: relative; overflow: hidden; border-radius: var(--rb-r-lg, 20px); background: var(--card);
  border: 1px solid var(--border); box-shadow: var(--rb-elev-1);
}
.cmp__main {
  display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 0 8px;
  width: 100%; padding: 0 0 10px; border: 0; background: none; color: inherit; font-family: inherit; text-align: left; cursor: pointer;
}
.cmp__art { grid-column: 1 / -1; display: block; height: 88px; margin-bottom: 8px; overflow: hidden; }
.cmp__art svg { display: block; width: 100%; height: 100%; }
.cmp__text { display: flex; min-width: 0; flex-direction: column; gap: 1px; padding-left: 14px; }
.cmp__title { font-family: var(--rb-font-display); font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
.cmp__body { font-size: 12px; line-height: 1.3; color: var(--muted-foreground); }
.cmp__chev { margin-right: 12px; color: var(--primary); }
/* Layer chips float over the bottom of the illustration — no extra row. */
.cmp__chips { position: absolute; top: 52px; left: 10px; right: 10px; display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
.cmp__chips::-webkit-scrollbar { display: none; }
.cmp__chip {
  display: inline-flex; flex-shrink: 0; height: 28px; align-items: center; gap: 6px; padding: 0 10px; border: 0; border-radius: 999px;
  background: var(--card); color: var(--foreground); font-family: inherit; font-size: 11.5px; font-weight: 600; cursor: pointer;
  box-shadow: var(--rb-elev-1);
}
.cmp__dot { width: 8px; height: 8px; border-radius: 999px; }
.cmp__dot--agencies { background: var(--primary); }
.cmp__dot--screens { background: var(--rb-cta); }
.cmp__dot--metro { background: var(--rb-metro-chilonzor); }
.cmp__main:active, .cmp__chip:active { transform: scale(0.98); }
.cmp__main:focus-visible, .cmp__chip:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
@media (prefers-reduced-motion: reduce) { .cmp__main:active, .cmp__chip:active { transform: none; } }

/* illustration */
.m-ground { fill: color-mix(in srgb, var(--primary) 7%, var(--card)); }
.m-block rect { fill: var(--card); opacity: 0.85; }
.m-park { fill: color-mix(in srgb, var(--rb-metro-yunusobod) 22%, var(--card)); }
.m-water { fill: none; stroke: color-mix(in srgb, var(--rb-glow) 45%, var(--card)); stroke-width: 9; stroke-linecap: round; }
.m-road path { fill: none; stroke: var(--card); stroke-width: 7; }
.m-line { fill: none; stroke-width: 4.5; stroke-linecap: round; stroke-linejoin: round; }
.m-line--red { stroke: var(--rb-metro-chilonzor); }
.m-line--blue { stroke: var(--rb-metro-ozbekiston); }
.m-station circle { fill: var(--card); stroke: var(--foreground); stroke-width: 2; }
.m-metro-badge { fill: var(--rb-metro-ozbekiston); stroke: var(--card); stroke-width: 2.5; }
.m-metro-text { fill: var(--card); font-family: var(--rb-font-display); font-size: 13px; font-weight: 800; }
.m-led { fill: var(--rb-cta); }
.m-led-glass { fill: color-mix(in srgb, var(--rb-cta) 35%, var(--card)); }
.m-led-stand { stroke: var(--rb-cta); stroke-width: 3; stroke-linecap: round; }
.m-pin { fill: var(--primary); stroke: var(--card); stroke-width: 2; }
.m-pin-dot { fill: var(--card); }
</style>
