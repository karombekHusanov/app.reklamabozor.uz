<script setup lang="ts">
import { CheckCheck, Gavel, Megaphone, Sparkles, Trophy, Users } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'

const locale = useLocaleStore()
const router = useRouter()
const { haptic } = useTelegram()

const t = computed(() => locale.t.tender)

/** How a tender works — four beats, revealed in sequence. */
const steps = computed(() => [
  { icon: Megaphone, label: t.value.step1, tone: 'tender-step--amber' },
  { icon: Users, label: t.value.step2, tone: 'tender-step--violet' },
  { icon: Gavel, label: t.value.step3, tone: 'tender-step--sky' },
  { icon: Trophy, label: t.value.step4, tone: 'tender-step--emerald' },
])

function createOrder() {
  haptic('light')
  void router.push(ROUTES.newOrder)
}
</script>

<template>
  <div class="tender-page pb-6">
    <AppHeader
      :title="t.title"
      :subtitle="t.subtitle"
      show-back
    />

    <section class="space-y-4 px-5">
      <GlassCard
        padding="none"
        class="tender-hero relative overflow-hidden"
      >
        <div class="tender-hero__orb tender-hero__orb--1" aria-hidden="true" />
        <div class="tender-hero__orb tender-hero__orb--2" aria-hidden="true" />

        <!-- Competing bid chips — agencies racing to outbid each other. -->
        <div class="tender-bid tender-bid--1" aria-hidden="true">−12%</div>
        <div class="tender-bid tender-bid--2" aria-hidden="true">−18%</div>
        <div class="tender-bid tender-bid--3" aria-hidden="true">★ 4.9</div>

        <div class="relative z-10 flex flex-col items-center px-6 py-10 text-center">
          <span class="tender-soon-badge">
            <Sparkles class="size-3.5 shrink-0" />
            {{ t.comingSoonBadge }}
          </span>

          <!-- Auction gavel: strikes the sound block on a loop. -->
          <div class="tender-gavel mt-7" aria-hidden="true">
            <span class="tender-gavel__ring" />
            <svg
              class="tender-gavel__svg"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <!-- sound block -->
              <rect
                x="34"
                y="92"
                width="52"
                height="11"
                rx="5.5"
                class="tender-gavel__block"
              />
              <!-- impact sparks on strike -->
              <g class="tender-gavel__spark">
                <line x1="60" y1="82" x2="60" y2="72" />
                <line x1="46" y1="86" x2="39" y2="79" />
                <line x1="74" y1="86" x2="81" y2="79" />
              </g>
              <!-- the mallet (handle + head), pivots to strike -->
              <g class="tender-gavel__mallet">
                <rect
                  x="55"
                  y="40"
                  width="10"
                  height="46"
                  rx="5"
                  class="tender-gavel__handle"
                  transform="rotate(38 60 63)"
                />
                <rect
                  x="26"
                  y="26"
                  width="40"
                  height="22"
                  rx="9"
                  class="tender-gavel__head"
                  transform="rotate(38 46 37)"
                />
              </g>
            </svg>
          </div>

          <h2 class="mt-7 text-xl font-bold tracking-tight text-foreground">
            {{ t.comingSoonTitle }}
          </h2>
          <p class="mt-2 max-w-[18rem] text-sm leading-relaxed text-muted-foreground">
            {{ t.comingSoonBody }}
          </p>

          <div
            class="tender-progress mt-6"
            :aria-label="t.stayTuned"
          >
            <span class="tender-progress__dot tender-progress__dot--1" />
            <span class="tender-progress__dot tender-progress__dot--2" />
            <span class="tender-progress__dot tender-progress__dot--3" />
          </div>
        </div>
      </GlassCard>

      <!-- How it will work -->
      <div class="grid grid-cols-2 gap-2.5">
        <div
          v-for="(step, index) in steps"
          :key="step.label"
          class="tender-step glass-chip"
          :class="step.tone"
          :style="{ animationDelay: `${index * 120}ms` }"
        >
          <span class="tender-step__num">{{ index + 1 }}</span>
          <span class="tender-step__icon">
            <component :is="step.icon" class="size-4" />
          </span>
          <span class="text-xs font-semibold leading-tight">
            {{ step.label }}
          </span>
        </div>
      </div>

      <GlassCard class="tender-cta">
        <div class="flex items-start gap-3">
          <span class="tender-cta__icon">
            <CheckCheck class="size-4" />
          </span>
          <p class="text-sm leading-relaxed text-muted-foreground">
            {{ t.ctaHint }}
          </p>
        </div>
        <Button
          class="mt-4 w-full rounded-2xl"
          @click="createOrder"
        >
          {{ t.ctaButton }}
        </Button>
      </GlassCard>
    </section>
  </div>
</template>

<style scoped>
.tender-hero {
  min-height: 20rem;
}

.tender-hero__orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(44px);
  opacity: 0.5;
  pointer-events: none;
}

.tender-hero__orb--1 {
  top: -2.5rem;
  left: -1.5rem;
  width: 9rem;
  height: 9rem;
  background: color-mix(in oklab, #f59e0b 55%, transparent);
  animation: tender-orb-drift 9s ease-in-out infinite;
}

.tender-hero__orb--2 {
  right: -2rem;
  bottom: -1rem;
  width: 8.5rem;
  height: 8.5rem;
  background: color-mix(in oklab, var(--primary) 45%, transparent);
  animation: tender-orb-drift 11s ease-in-out infinite reverse;
}

.tender-bid {
  position: absolute;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklab, #f59e0b 30%, transparent);
  background: color-mix(in oklab, var(--card) 84%, transparent);
  padding: 0.25rem 0.625rem;
  font-size: 0.6875rem;
  font-weight: 800;
  color: #b45309;
  box-shadow: 0 8px 22px rgba(180, 83, 9, 0.14);
  backdrop-filter: blur(8px);
}

:global(.dark) .tender-bid {
  color: #fbbf24;
  border-color: color-mix(in oklab, #f59e0b 40%, transparent);
}

.tender-bid--1 {
  top: 3.25rem;
  left: 1.25rem;
  animation: tender-bid-float 5.4s ease-in-out infinite;
}

.tender-bid--2 {
  top: 5rem;
  right: 1.25rem;
  animation: tender-bid-float 6.1s ease-in-out infinite 0.7s;
}

.tender-bid--3 {
  top: 2rem;
  right: 2.75rem;
  animation: tender-bid-float 5.7s ease-in-out infinite 1.3s;
}

.tender-soon-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklab, #f59e0b 30%, transparent);
  background: color-mix(in oklab, #f59e0b 12%, var(--card));
  padding: 0.375rem 0.875rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #b45309;
  animation: tender-badge-shimmer 3s ease-in-out infinite;
}

:global(.dark) .tender-soon-badge {
  color: #fbbf24;
}

.tender-gavel {
  position: relative;
  display: flex;
  width: 6.5rem;
  height: 6.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--card) 88%, #f59e0b 12%);
  box-shadow:
    0 12px 34px rgba(180, 83, 9, 0.16),
    inset 0 1px 0 color-mix(in oklab, white 60%, transparent);
}

.tender-gavel__ring {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklab, #f59e0b 40%, transparent);
  animation: tender-ring-pulse 2.8s ease-out infinite;
}

.tender-gavel__svg {
  width: 4.75rem;
  height: 4.75rem;
}

.tender-gavel__block {
  fill: color-mix(in oklab, #b45309 85%, transparent);
}

.tender-gavel__handle,
.tender-gavel__head {
  fill: #d97706;
}

.tender-gavel__head {
  fill: #f59e0b;
}

.tender-gavel__mallet {
  transform-origin: 60px 78px;
  animation: tender-strike 2.4s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.tender-gavel__spark {
  stroke: #f59e0b;
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0;
  transform-origin: 60px 82px;
  animation: tender-spark 2.4s ease-out infinite;
}

.tender-progress {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.tender-progress__dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  background: color-mix(in oklab, #f59e0b 45%, transparent);
  animation: tender-dot-wave 1.4s ease-in-out infinite;
}

.tender-progress__dot--2 {
  animation-delay: 0.2s;
}

.tender-progress__dot--3 {
  animation-delay: 0.4s;
}

.tender-step {
  position: relative;
  display: flex;
  min-height: 5rem;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 1.25rem;
  padding: 0.875rem;
  animation: tender-step-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.tender-step__num {
  position: absolute;
  right: 0.75rem;
  top: 0.625rem;
  font-size: 0.875rem;
  font-weight: 800;
  color: color-mix(in oklab, var(--muted-foreground) 55%, transparent);
}

.tender-step__icon {
  display: flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
}

.tender-step--amber .tender-step__icon {
  background: color-mix(in oklab, #d97706 15%, var(--card));
  color: #d97706;
}

.tender-step--violet .tender-step__icon {
  background: color-mix(in oklab, #7c3aed 14%, var(--card));
  color: #7c3aed;
}

.tender-step--sky .tender-step__icon {
  background: color-mix(in oklab, #0386d9 14%, var(--card));
  color: #0386d9;
}

.tender-step--emerald .tender-step__icon {
  background: color-mix(in oklab, #059669 14%, var(--card));
  color: #059669;
}

.tender-cta {
  border-style: dashed;
  border-color: color-mix(in oklab, #f59e0b 22%, var(--border));
}

.tender-cta__icon {
  display: flex;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.625rem;
  background: color-mix(in oklab, #059669 14%, var(--card));
  color: #059669;
}

@keyframes tender-orb-drift {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(0.75rem, -0.5rem) scale(1.08);
  }
}

@keyframes tender-bid-float {
  0%,
  100% {
    transform: translateY(0) rotate(-3deg);
  }
  50% {
    transform: translateY(-0.5rem) rotate(3deg);
  }
}

@keyframes tender-badge-shimmer {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(245, 158, 11, 0);
  }
  50% {
    box-shadow: 0 0 18px rgba(245, 158, 11, 0.22);
  }
}

@keyframes tender-ring-pulse {
  0% {
    transform: scale(0.92);
    opacity: 0.85;
  }
  70% {
    transform: scale(1.2);
    opacity: 0;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

/* Gavel raises, then snaps down to strike, with a small bounce. */
@keyframes tender-strike {
  0% {
    transform: rotate(-32deg);
  }
  35% {
    transform: rotate(-34deg);
  }
  50% {
    transform: rotate(4deg);
  }
  58% {
    transform: rotate(-6deg);
  }
  66% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-32deg);
  }
}

@keyframes tender-spark {
  0%,
  46% {
    opacity: 0;
    transform: scale(0.6);
  }
  52% {
    opacity: 0.9;
    transform: scale(1);
  }
  70% {
    opacity: 0;
    transform: scale(1.25);
  }
  100% {
    opacity: 0;
  }
}

@keyframes tender-dot-wave {
  0%,
  80%,
  100% {
    transform: scale(0.85);
    opacity: 0.45;
  }
  40% {
    transform: scale(1.15);
    opacity: 1;
  }
}

@keyframes tender-step-in {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
