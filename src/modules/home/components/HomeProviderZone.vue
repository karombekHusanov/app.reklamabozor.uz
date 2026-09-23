<script setup lang="ts">
import { ArrowRight, BellRing, Clock, Trophy, Wallet } from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'

/**
 * Supply side of the marketplace. Non-providers get the pitch + apply CTA;
 * applicants see their review status; approved providers jump to requests.
 */
const props = defineProps<{
  state: 'none' | 'pending' | 'approved'
  newCount: number
}>()

const emit = defineEmits<{ apply: [], open: [] }>()

const locale = useLocaleStore()

const perks = computed(() => [
  { icon: BellRing, text: locale.t.landing.prov1 },
  { icon: Wallet, text: locale.t.landing.prov2 },
  { icon: Trophy, text: locale.t.landing.prov3 },
])
</script>

<template>
  <section
    class="pz"
    :aria-label="locale.t.landing.provEyebrow"
  >
    <span
      class="pz__glow"
      aria-hidden="true"
    />
    <span class="pz__eyebrow">{{ locale.t.landing.provEyebrow }}</span>
    <h2 class="pz__title">
      {{ locale.t.landing.provTitle }}
    </h2>

    <ul class="pz__perks">
      <li
        v-for="(perk, i) in perks"
        :key="i"
        class="rb-stagger"
        :style="{ '--i': i }"
      >
        <span
          class="pz__ic"
          aria-hidden="true"
        ><component
          :is="perk.icon"
          class="size-4"
        /></span>
        {{ perk.text }}
      </li>
    </ul>

    <p
      v-if="state === 'pending'"
      class="pz__status"
    >
      <Clock class="size-4 shrink-0" />
      {{ locale.t.landing.provPending }}
    </p>
    <button
      v-else-if="state === 'approved'"
      type="button"
      class="pz__cta"
      @click="emit('open')"
    >
      <span>
        {{ locale.t.landing.provOpen }}
        <small v-if="props.newCount > 0">{{ locale.t.landing.provNew.replace('{count}', String(props.newCount)) }}</small>
      </span>
      <ArrowRight class="size-4" />
    </button>
    <button
      v-else
      type="button"
      class="pz__cta"
      @click="emit('apply')"
    >
      <span>{{ locale.t.landing.provApply }}</span>
      <ArrowRight class="size-4" />
    </button>
  </section>
</template>

<style scoped>
/* Deliberately inverted (dark ink in light theme, light in dark) so the
   supply-side pitch reads as a separate chapter of the page. */
.pz {
  position: relative; overflow: hidden; padding: 20px 18px 18px; border-radius: var(--rb-r-card);
  background: var(--foreground); color: var(--background); box-shadow: var(--rb-elev-2);
  --pz-accent: var(--rb-glow);
}
/* Dark theme flips the card light — cyan loses contrast there, use brand blue. */
:global(.dark) .pz { --pz-accent: var(--brand-600); }
.pz__glow {
  position: absolute; right: -60px; top: -60px; width: 200px; height: 200px; border-radius: 999px; filter: blur(50px); pointer-events: none;
  background: radial-gradient(circle, color-mix(in srgb, var(--rb-glow) 50%, transparent) 0%, transparent 70%);
}
.pz__eyebrow {
  position: relative; font-family: var(--rb-font-display); font-weight: 800; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--pz-accent);
}
.pz__title {
  position: relative; margin: 6px 0 0; font-family: var(--rb-font-display); font-weight: 900; font-size: 22px; line-height: 1.12;
  letter-spacing: -0.025em; text-wrap: balance;
}
.pz__perks { position: relative; list-style: none; margin: 14px 0 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.pz__perks li { display: flex; align-items: center; gap: 10px; font-size: 13px; line-height: 1.35; opacity: 0.92; }
.pz__ic {
  flex-shrink: 0; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px;
  background: color-mix(in srgb, var(--background) 12%, transparent); color: var(--pz-accent);
}
.pz__status { position: relative; display: flex; align-items: center; gap: 8px; margin: 16px 0 0; font-size: 13px; font-weight: 600; }
.pz__cta {
  position: relative; display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 10px; min-height: 52px; margin-top: 16px; padding: 0 18px;
  border: 0; border-radius: var(--rb-r-field); background: var(--background); color: var(--foreground);
  font-family: var(--rb-font-display); font-weight: 800; font-size: 14.5px; text-align: left; cursor: pointer;
  transition: transform var(--rb-dur) var(--rb-ease);
  -webkit-tap-highlight-color: transparent;
}
.pz__cta small { display: block; margin-top: 1px; font-family: var(--font-sans, inherit); font-size: 11px; font-weight: 600; color: var(--muted-foreground); }
.pz__cta:active { transform: scale(0.98); }
.pz__cta:focus-visible { outline: 2px solid var(--pz-accent); outline-offset: 3px; }
</style>
