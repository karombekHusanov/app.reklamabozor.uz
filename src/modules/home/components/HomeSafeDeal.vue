<script setup lang="ts">
import { BadgeCheck, Building2, FileSignature, Scale, ShieldCheck, Star, User } from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'

/**
 * Trust centrepiece: how a tender deal's money moves — client → platform
 * account → agency in two stages — plus the four platform guarantees.
 * Copy mirrors the real rules (60-min cancel window, 40% advance, final on
 * acceptance, KYC + agency agreement, moderated reviews, dispute payout gate).
 */
const locale = useLocaleStore()

const flow = computed(() => [
  locale.t.landing.flow1,
  locale.t.landing.flow2,
  locale.t.landing.flow3,
  locale.t.landing.flow4,
])

const guarantees = computed(() => [
  { icon: BadgeCheck, title: locale.t.landing.g1Title, sub: locale.t.landing.g1Sub },
  { icon: FileSignature, title: locale.t.landing.g2Title, sub: locale.t.landing.g2Sub },
  { icon: Star, title: locale.t.landing.g3Title, sub: locale.t.landing.g3Sub },
  { icon: Scale, title: locale.t.landing.g4Title, sub: locale.t.landing.g4Sub },
])
</script>

<template>
  <section
    id="safe-deal"
    class="safe"
    :aria-label="locale.t.landing.safeEyebrow"
  >
    <div class="vault brand-hero">
      <span
        class="vault__glow"
        aria-hidden="true"
      />

      <span class="vault__eyebrow">
        <ShieldCheck class="size-3.5" />
        {{ locale.t.landing.safeEyebrow }}
      </span>
      <h2 class="vault__title">
        {{ locale.t.landing.safeTitle }}
      </h2>
      <p class="vault__lead">
        {{ locale.t.landing.safeLead }}
      </p>

      <!-- money path -->
      <div
        class="path"
        aria-hidden="true"
      >
        <div class="path__node">
          <span class="path__ic"><User class="size-5" /></span>
          <span class="path__cap">{{ locale.t.landing.nodeYou }}</span>
        </div>

        <div class="path__track">
          <span class="path__line" />
          <span class="path__run"><span class="path__coin" /></span>
        </div>

        <div class="path__node path__node--core">
          <span class="path__ic path__ic--core">
            <span class="path__ring" />
            <ShieldCheck class="size-7" />
          </span>
          <span class="path__cap">{{ locale.t.landing.nodeUs }}</span>
        </div>

        <div class="path__track">
          <span class="path__line" />
          <span class="path__run path__run--late"><span class="path__coin" /></span>
        </div>

        <div class="path__node">
          <span class="path__ic"><Building2 class="size-5" /></span>
          <span class="path__cap">{{ locale.t.landing.nodeAgency }}</span>
        </div>
      </div>

      <ol class="steps">
        <li
          v-for="(line, i) in flow"
          :key="i"
          class="steps__item rb-stagger"
          :style="{ '--i': i }"
        >
          <span class="steps__n">{{ i + 1 }}</span>
          <span>{{ line }}</span>
        </li>
      </ol>
    </div>

    <div class="guar">
      <div
        v-for="(g, i) in guarantees"
        :key="g.title"
        class="guar__card rb-stagger"
        :style="{ '--i': i + 3 }"
      >
        <span
          class="guar__ic"
          aria-hidden="true"
        ><component
          :is="g.icon"
          class="size-[18px]"
        /></span>
        <p class="guar__t">
          {{ g.title }}
        </p>
        <p class="guar__s">
          {{ g.sub }}
        </p>
      </div>
    </div>

    <p class="safe__note">
      {{ locale.t.landing.safeNote }}
    </p>
  </section>
</template>

<style scoped>
.vault {
  position: relative; overflow: hidden; padding: 20px 18px 18px;
  border-radius: var(--rb-r-card); color: #fff; box-shadow: var(--rb-elev-2);
  scroll-margin-top: 16px;
  container-type: inline-size;
}
.vault__glow {
  position: absolute; top: 80px; left: 50%; width: 260px; height: 200px; transform: translateX(-50%);
  border-radius: 999px; filter: blur(50px); pointer-events: none;
  background: radial-gradient(circle, color-mix(in srgb, var(--rb-glow) 45%, transparent) 0%, transparent 70%);
}

.vault__eyebrow {
  position: relative; display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 11px 5px 9px; border-radius: var(--rb-r-chip);
  background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.18);
  color: var(--rb-glow-soft); font-size: 10.5px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
}
.vault__title {
  position: relative; margin: 12px 0 0;
  font-family: var(--rb-font-display); font-weight: 900; line-height: 1.12; letter-spacing: -0.025em;
  /* Scales with the card so the first line runs the full width on every phone
     ("Pulingiz ish bajarilguncha" / "himoyada"), instead of three short lines. */
  font-size: 21px; font-size: clamp(20px, 6.2cqw, 28px);
}
.vault__lead { position: relative; margin: 8px 0 0; font-size: 13px; line-height: 1.5; color: rgba(255, 255, 255, 0.82); }

/* money path */
.path { position: relative; display: flex; align-items: flex-start; margin: 22px 0 6px; }
.path__node { display: flex; flex-direction: column; align-items: center; gap: 7px; flex-shrink: 0; width: 64px; }
.path__node--core { width: 84px; }
.path__ic {
  position: relative; display: grid; place-items: center; width: 46px; height: 46px; border-radius: 15px;
  background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.2);
}
.path__ic--core {
  width: 64px; height: 64px; border-radius: 20px; color: #fff;
  background: linear-gradient(150deg, var(--rb-glow), var(--primary));
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow: 0 12px 28px -10px color-mix(in srgb, var(--rb-glow) 80%, transparent);
}
.path__ring {
  position: absolute; inset: -6px; border-radius: 24px; border: 1.5px solid var(--rb-glow-soft);
  opacity: 0; animation: vaultPulse 2.8s var(--rb-ease) infinite;
}
.path__cap { font-size: 11px; font-weight: 700; color: rgba(255, 255, 255, 0.86); text-align: center; line-height: 1.2; }
.path__node--core .path__cap { color: #fff; font-family: var(--rb-font-display); font-weight: 800; }

/* Side icons (46px) and tracks drop 9px so every centre sits on the 64px
   core icon's mid-line (y = 32) and the dashed line meets them all. */
.path__node:not(.path__node--core) .path__ic { margin-top: 9px; }
.path__track { position: relative; flex: 1; min-width: 0; height: 64px; margin-top: 9px; }
.path__line {
  position: absolute; left: 0; right: 0; top: 23px; height: 2px;
  background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.45) 0 5px, transparent 5px 10px);
}
.path__run { position: absolute; inset: 0; animation: coinRun 2.8s var(--rb-ease) infinite; }
.path__run--late { animation-delay: 1.4s; }
.path__coin {
  position: absolute; left: 0; top: 18px; width: 12px; height: 12px; margin-left: -6px; border-radius: 999px;
  background: var(--rb-glow-soft); box-shadow: 0 0 12px 3px color-mix(in srgb, var(--rb-glow) 70%, transparent);
}

/* flow steps */
.steps { position: relative; list-style: none; margin: 14px 0 0; padding: 0; display: grid; grid-auto-rows: minmax(44px, auto); gap: 6px; }
.steps::before { content: ""; position: absolute; left: 11px; top: 22px; bottom: 22px; width: 2px; background: rgba(255, 255, 255, 0.16); border-radius: 2px; }
.steps__item { position: relative; display: flex; align-items: center; gap: 11px; font-size: 13px; line-height: 1.45; color: rgba(255, 255, 255, 0.92); }
.steps__n {
  flex-shrink: 0; width: 24px; height: 24px; border-radius: 999px; display: grid; place-items: center;
  background: #fff; color: var(--primary); font-family: var(--rb-font-display); font-weight: 900; font-size: 11.5px;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--rb-glow) 25%, transparent);
}

/* guarantees */
.guar { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
.guar__card { padding: 13px; background: var(--card); border: 1px solid var(--border); border-radius: var(--rb-r-tile); box-shadow: var(--rb-elev-1); }
.guar__ic {
  display: grid; place-items: center; width: 34px; height: 34px; border-radius: 11px; margin-bottom: 9px;
  background: color-mix(in srgb, var(--success) 14%, var(--card)); color: var(--success);
}
.guar__t { margin: 0; font-family: var(--rb-font-display); font-weight: 800; font-size: 13.5px; line-height: 1.2; letter-spacing: -0.01em; color: var(--foreground); }
.guar__s { margin: 4px 0 0; font-size: 11.5px; line-height: 1.4; color: var(--muted-foreground); }

.safe__note { margin: 10px 2px 0; font-size: 11.5px; line-height: 1.45; color: var(--muted-foreground); }

@keyframes coinRun {
  0% { transform: translateX(0); opacity: 0; }
  12% { opacity: 1; }
  48% { transform: translateX(100%); opacity: 1; }
  56%, 100% { transform: translateX(100%); opacity: 0; }
}
@keyframes vaultPulse {
  0%, 40% { opacity: 0; transform: scale(0.92); }
  55% { opacity: 0.9; }
  100% { opacity: 0; transform: scale(1.14); }
}

@media (prefers-reduced-motion: reduce) {
  .path__run, .path__ring { animation: none !important; }
  .path__run { transform: translateX(50%); }
}
</style>
