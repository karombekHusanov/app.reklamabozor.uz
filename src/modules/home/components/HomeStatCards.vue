<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import Avatar from '@/core/ui/Avatar.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { LiveStats } from '@/modules/home/services/live-stats.service'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'

/**
 * Social-proof strip — one slim line on the hero seam that says "this is a
 * real, busy marketplace": real agency logos, verified-agency and
 * active-request counts, and who's online right now. Glanceable, not a feature.
 */
const props = defineProps<{
  stats: LiveStats | null
  agents: PublicAgent[]
}>()

const emit = defineEmits<{ open: [] }>()

const locale = useLocaleStore()

const reduce = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const faces = computed(() => props.agents.slice(0, 3))

const targets = computed(() => [
  props.stats?.agencies_total ?? 0,
  props.stats?.active_orders ?? 0,
  props.stats?.agents_online ?? 0,
])

/** Animated count-up, keyed to the resolved stat values. */
const shown = ref<number[]>([0, 0, 0])

function animateTo(to: number[]) {
  if (reduce) { shown.value = [...to]; return }
  const from = [...shown.value]
  const start = performance.now()
  function tick(now: number) {
    const p = Math.min((now - start) / 900, 1)
    const eased = 1 - (1 - p) ** 3
    shown.value = to.map((t, i) => Math.round(from[i] + (t - from[i]) * eased))
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

onMounted(() => animateTo(targets.value))
watch(() => targets.value.join(','), () => animateTo(targets.value))

/** Split "{count} …" copy so the number can be styled/animated on its own. */
function parts(tpl: string) {
  const [before = '', after = ''] = tpl.split('{count}')
  return { before, after }
}
const agencies = computed(() => parts(locale.t.landing.proofAgencies))
const requests = computed(() => parts(locale.t.landing.proofRequests))
const online = computed(() => parts(locale.t.landing.proofOnline))
</script>

<template>
  <button
    type="button"
    class="proof"
    @click="emit('open')"
  >
    <span
      v-if="faces.length"
      class="proof__faces"
      aria-hidden="true"
    >
      <Avatar
        v-for="(agent, i) in faces"
        :key="agent.id"
        :src="agent.company_logo ?? agent.avatar"
        :name="agent.display_name"
        size="sm"
        class="proof__face size-7 text-[10px]"
        :style="{ '--i': i }"
      />
    </span>

    <span class="proof__text">
      <span class="proof__main">{{ agencies.before }}<b>{{ shown[0] }}</b>{{ agencies.after }}</span>
      <span class="proof__sub">
        {{ requests.before }}{{ shown[1] }}{{ requests.after }}
        <template v-if="stats?.agents_online != null">
          <span
            class="proof__sep"
            aria-hidden="true"
          >·</span>
          <span class="proof__live">
            <span
              class="proof__dot"
              aria-hidden="true"
            />
            {{ online.before }}{{ shown[2] }}{{ online.after }}
          </span>
        </template>
      </span>
    </span>

    <ChevronRight
      class="proof__chev"
      aria-hidden="true"
    />
  </button>
</template>

<style scoped>
.proof {
  display: flex; width: 100%; align-items: center; gap: 10px; min-height: 52px; padding: 8px 10px 8px 10px;
  border: 1px solid var(--border); border-radius: var(--rb-r-field); background: var(--card); box-shadow: var(--rb-elev-2);
  color: var(--foreground); font-family: inherit; text-align: left; cursor: pointer;
  animation: proofIn 500ms var(--rb-ease) both 150ms;
  transition: transform var(--rb-dur) var(--rb-ease);
  -webkit-tap-highlight-color: transparent;
}
.proof:active { transform: scale(0.985); }
.proof:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

.proof__faces { display: flex; flex-shrink: 0; padding-left: 6px; }
.proof__face {
  margin-left: -8px; border: 2px solid var(--card); border-radius: 999px;
  animation: faceIn 420ms var(--rb-ease) both; animation-delay: calc(300ms + var(--i) * 80ms);
}

.proof__text { display: flex; flex: 1; min-width: 0; flex-direction: column; line-height: 1.2; }
.proof__main { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.proof__main b { font-family: var(--rb-font-display); font-weight: 900; font-variant-numeric: tabular-nums; }
.proof__sub { margin-top: 1px; font-size: 11px; color: var(--muted-foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }

.proof__sep { margin-inline: 3px; }
.proof__live { display: inline-flex; align-items: center; gap: 5px; color: var(--success); font-weight: 700; }
.proof__dot { position: relative; width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
.proof__dot::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: currentColor; animation: ripple 1.8s ease-out infinite; }

.proof__chev { width: 16px; height: 16px; flex-shrink: 0; color: var(--muted-foreground); }

@keyframes proofIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes faceIn { from { opacity: 0; transform: translateX(-6px) scale(0.8); } to { opacity: 1; transform: none; } }
@keyframes ripple { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(3); opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .proof, .proof__face, .proof__dot::after { animation: none !important; }
}
</style>
