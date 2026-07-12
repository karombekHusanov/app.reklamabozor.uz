<script setup lang="ts">
import { Megaphone, MonitorPlay, Package, Sparkles, Store, Tv } from '@lucide/vue'
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

const previewItems = computed(() => [
  { icon: Tv, label: locale.t.products.featureOutdoor, tone: 'products-preview--sky' },
  { icon: MonitorPlay, label: locale.t.products.featureDigital, tone: 'products-preview--violet' },
  { icon: Megaphone, label: locale.t.products.featurePrint, tone: 'products-preview--coral' },
  { icon: Store, label: locale.t.products.featureMedia, tone: 'products-preview--teal' },
])

function exploreProviders() {
  haptic('light')
  void router.push(ROUTES.agencies)
}
</script>

<template>
  <div class="products-page pb-6">
    <AppHeader
      :title="locale.t.products.title"
      :subtitle="locale.t.products.subtitle"
      show-back
    />

    <section class="space-y-4 px-5">
      <GlassCard
        padding="none"
        class="products-hero relative overflow-hidden"
      >
        <div
          class="products-hero__orb products-hero__orb--1"
          aria-hidden="true"
        />
        <div
          class="products-hero__orb products-hero__orb--2"
          aria-hidden="true"
        />
        <div
          class="products-hero__orb products-hero__orb--3"
          aria-hidden="true"
        />

        <div
          class="products-float products-float--1"
          aria-hidden="true"
        >
          <Tv class="size-4 text-primary/70" />
        </div>
        <div
          class="products-float products-float--2"
          aria-hidden="true"
        >
          <Megaphone class="size-4 text-primary/60" />
        </div>
        <div
          class="products-float products-float--3"
          aria-hidden="true"
        >
          <MonitorPlay class="size-4 text-primary/65" />
        </div>

        <div class="relative z-10 flex flex-col items-center px-6 py-10 text-center">
          <span class="products-soon-badge">
            <Sparkles class="size-3.5 shrink-0" />
            {{ locale.t.products.comingSoonBadge }}
          </span>

          <div class="products-icon-ring mt-6">
            <span
              class="products-icon-ring__pulse"
              aria-hidden="true"
            />
            <span class="products-icon-ring__core">
              <Package
                class="size-9 text-primary"
                :stroke-width="1.75"
              />
            </span>
          </div>

          <h2 class="mt-6 text-xl font-bold tracking-tight text-foreground">
            {{ locale.t.products.comingSoonTitle }}
          </h2>
          <p class="mt-2 max-w-[17rem] text-sm leading-relaxed text-muted-foreground">
            {{ locale.t.products.comingSoonBody }}
          </p>

          <div
            class="products-progress mt-6"
            :aria-label="locale.t.products.stayTuned"
          >
            <span class="products-progress__dot products-progress__dot--1" />
            <span class="products-progress__dot products-progress__dot--2" />
            <span class="products-progress__dot products-progress__dot--3" />
          </div>
        </div>
      </GlassCard>

      <div class="grid grid-cols-2 gap-2.5">
        <div
          v-for="(item, index) in previewItems"
          :key="item.label"
          class="products-preview glass-chip"
          :class="item.tone"
          :style="{ animationDelay: `${index * 120}ms` }"
        >
          <span class="products-preview__icon">
            <component
              :is="item.icon"
              class="size-4"
            />
          </span>
          <span class="text-xs font-semibold leading-tight">
            {{ item.label }}
          </span>
        </div>
      </div>

      <GlassCard class="products-cta">
        <p class="text-sm leading-relaxed text-muted-foreground">
          {{ locale.t.products.exploreHint }}
        </p>
        <Button
          class="mt-4 w-full rounded-2xl"
          @click="exploreProviders"
        >
          {{ locale.t.products.exploreProviders }}
        </Button>
      </GlassCard>
    </section>
  </div>
</template>

<style scoped>
.products-hero {
  min-height: 18.5rem;
}

.products-hero__orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(42px);
  opacity: 0.55;
  pointer-events: none;
}

.products-hero__orb--1 {
  top: -2.5rem;
  left: -1.5rem;
  width: 9rem;
  height: 9rem;
  background: color-mix(in oklab, var(--primary) 55%, transparent);
  animation: products-orb-drift 9s ease-in-out infinite;
}

.products-hero__orb--2 {
  right: -2rem;
  bottom: -1rem;
  width: 8rem;
  height: 8rem;
  background: color-mix(in oklab, var(--brand-cyan) 45%, transparent);
  animation: products-orb-drift 11s ease-in-out infinite reverse;
}

.products-hero__orb--3 {
  top: 45%;
  left: 50%;
  width: 6rem;
  height: 6rem;
  transform: translate(-50%, -50%);
  background: color-mix(in oklab, var(--brand-teal) 35%, transparent);
  animation: products-orb-pulse 6s ease-in-out infinite;
}

.products-float {
  position: absolute;
  z-index: 1;
  display: flex;
  size: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.875rem;
  border: 1px solid color-mix(in oklab, var(--primary) 18%, transparent);
  background: color-mix(in oklab, var(--card) 82%, transparent);
  box-shadow: 0 8px 24px rgba(2, 48, 92, 0.08);
  backdrop-filter: blur(8px);
}

.products-float--1 {
  top: 1.5rem;
  left: 1.25rem;
  animation: products-float 5.5s ease-in-out infinite;
}

.products-float--2 {
  top: 2rem;
  right: 1.5rem;
  animation: products-float 6.2s ease-in-out infinite 0.8s;
}

.products-float--3 {
  bottom: 2.5rem;
  left: 2rem;
  animation: products-float 5.8s ease-in-out infinite 1.4s;
}

.products-soon-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklab, var(--primary) 22%, transparent);
  background: color-mix(in oklab, var(--primary) 10%, var(--card));
  padding: 0.375rem 0.875rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary);
  animation: products-badge-shimmer 3s ease-in-out infinite;
}

.products-icon-ring {
  position: relative;
  display: flex;
  size: 5.5rem;
  align-items: center;
  justify-content: center;
}

.products-icon-ring__pulse {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklab, var(--primary) 25%, transparent);
  animation: products-ring-pulse 2.8s ease-out infinite;
}

.products-icon-ring__core {
  position: relative;
  z-index: 1;
  display: flex;
  size: 4.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--card) 90%, var(--primary) 10%);
  box-shadow:
    0 10px 30px rgba(2, 48, 92, 0.12),
    inset 0 1px 0 color-mix(in oklab, white 60%, transparent);
}

.products-progress {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.products-progress__dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--primary) 35%, transparent);
  animation: products-dot-wave 1.4s ease-in-out infinite;
}

.products-progress__dot--2 {
  animation-delay: 0.2s;
}

.products-progress__dot--3 {
  animation-delay: 0.4s;
}

.products-preview {
  display: flex;
  min-height: 4.75rem;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 1.25rem;
  padding: 0.875rem;
  animation: products-preview-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.products-preview__icon {
  display: flex;
  size: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
}

.products-preview--sky .products-preview__icon {
  background: color-mix(in oklab, #0386D9 14%, var(--card));
  color: #0386D9;
}

.products-preview--violet .products-preview__icon {
  background: color-mix(in oklab, #7c3aed 14%, var(--card));
  color: #7c3aed;
}

.products-preview--coral .products-preview__icon {
  background: color-mix(in oklab, #f97316 14%, var(--card));
  color: #f97316;
}

.products-preview--teal .products-preview__icon {
  background: color-mix(in oklab, #137AA6 14%, var(--card));
  color: #137AA6;
}

.products-cta {
  border-style: dashed;
  border-color: color-mix(in oklab, var(--primary) 18%, var(--border));
}

@keyframes products-orb-drift {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(0.75rem, -0.5rem) scale(1.08);
  }
}

@keyframes products-orb-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: translate(-50%, -50%) scale(0.95);
  }
  50% {
    opacity: 0.65;
    transform: translate(-50%, -50%) scale(1.08);
  }
}

@keyframes products-float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-0.45rem) rotate(3deg);
  }
}

@keyframes products-badge-shimmer {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(11, 107, 203, 0);
  }
  50% {
    box-shadow: 0 0 18px rgba(11, 107, 203, 0.18);
  }
}

@keyframes products-ring-pulse {
  0% {
    transform: scale(0.92);
    opacity: 0.85;
  }
  70% {
    transform: scale(1.18);
    opacity: 0;
  }
  100% {
    transform: scale(1.18);
    opacity: 0;
  }
}

@keyframes products-dot-wave {
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

@keyframes products-preview-in {
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
