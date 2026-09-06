<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { LiveStats } from '@/modules/home/services/live-stats.service'

const props = defineProps<{
  stats: LiveStats | null
}>()

const locale = useLocaleStore()

const reduce = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const cards = computed(() => [
  { key: 'agencies', value: props.stats?.agencies_total ?? 0, label: locale.t.home.heroStatAgencies },
  { key: 'live', value: props.stats?.active_orders ?? 0, label: locale.t.home.heroStatToday },
  { key: 'online', value: props.stats?.agents_online ?? 0, label: locale.t.home.heroStatOnline, live: true },
])

/** Animated count-up, keyed to the resolved stat values. */
const shown = ref<number[]>([0, 0, 0])

function animateTo(targets: number[]) {
  if (reduce) { shown.value = [...targets]; return }
  const start = performance.now()
  const from = [...shown.value]
  const dur = 1100
  function tick(now: number) {
    const p = Math.min((now - start) / dur, 1)
    const eased = 1 - (1 - p) ** 3
    shown.value = targets.map((t, i) => Math.round(from[i] + (t - from[i]) * eased))
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

onMounted(() => animateTo(cards.value.map(c => c.value)))
watch(() => cards.value.map(c => c.value).join(','), () => animateTo(cards.value.map(c => c.value)))
</script>

<template>
  <div class="stats">
    <div
      v-for="(card, i) in cards"
      :key="card.key"
      class="stat"
    >
      <span class="stat__n">
        <span
          v-if="card.live"
          class="stat__grn"
          aria-hidden="true"
        />
        {{ shown[i] }}
      </span>
      <span class="stat__l">{{ card.label }}</span>
    </div>
  </div>
</template>

<style scoped>
@property --sang { syntax: "<angle>"; initial-value: 0deg; inherits: false; }

.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }

.stat {
  position: relative;
  background: var(--card);
  border-radius: 17px; padding: 13px 10px; box-shadow: var(--rb-elev-1);
  text-align: left;
}
.stat::before, .stat::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1.5px;
  background: conic-gradient(from var(--sang), var(--border) 0deg, var(--border) 205deg, var(--rb-glow) 280deg, var(--rb-glow-soft) 312deg, var(--border) 348deg);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  animation: statSpin 5s linear infinite;
  pointer-events: none;
}
.stat::after { filter: blur(5px); opacity: 0.85; }
.stat:nth-child(2)::before, .stat:nth-child(2)::after { animation-delay: -1.6s; }
.stat:nth-child(3)::before, .stat:nth-child(3)::after { animation-delay: -3.2s; }

.stat__n {
  font-family: var(--rb-font-display); font-weight: 900; font-size: 22px;
  letter-spacing: -0.02em; color: var(--foreground); font-variant-numeric: tabular-nums; line-height: 1;
  display: inline-flex; align-items: center; gap: 5px;
}
.stat__grn { width: 8px; height: 8px; border-radius: 999px; background: var(--success); box-shadow: 0 0 0 0 rgba(18, 183, 106, 0.5); animation: statPulse 2s ease-out infinite; }
.stat__l { display: block; margin-top: 5px; font-size: 10.5px; font-weight: 600; color: var(--muted-foreground); }

@keyframes statSpin { to { --sang: 360deg; } }
@keyframes statPulse { 0% { box-shadow: 0 0 0 0 rgba(18, 183, 106, 0.5); } 70% { box-shadow: 0 0 0 6px rgba(18, 183, 106, 0); } 100% { box-shadow: 0 0 0 0 rgba(18, 183, 106, 0); } }

@media (prefers-reduced-motion: reduce) {
  .stat::before, .stat::after, .stat__grn { animation: none !important; }
}
</style>
