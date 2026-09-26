<script setup lang="ts">
import { ArrowRight, Building2, X } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'

/**
 * "Become an agency" invite for non-agent users: dismissible on home,
 * permanent on the profile page.
 */
withDefaults(defineProps<{
  dismissible?: boolean
}>(), {
  dismissible: true,
})

const emit = defineEmits<{ open: [], hide: [] }>()

const locale = useLocaleStore()
</script>

<template>
  <section
    class="ar"
    :class="{ 'ar--static': !dismissible }"
  >
    <!-- decorative colour field, fades in from the right edge -->
    <span
      class="ar__aura"
      aria-hidden="true"
    />

    <span
      class="ar__icon"
      aria-hidden="true"
    >
      <Building2 class="size-5" />
    </span>

    <div class="ar__body">
      <p class="ar__title">
        {{ locale.t.agent.reminderTitle }}
      </p>
      <p class="ar__text">
        {{ locale.t.agent.reminderBody }}
      </p>
      <button
        type="button"
        class="ar__cta"
        @click="emit('open')"
      >
        {{ locale.t.agent.reminderCta }}
        <ArrowRight class="size-4" />
      </button>
    </div>

    <button
      v-if="dismissible"
      type="button"
      class="ar__close"
      :aria-label="locale.t.agent.reminderHide"
      @click="emit('hide')"
    >
      <X class="size-4" />
    </button>
  </section>
</template>

<style scoped>
.ar {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  overflow: hidden;
  padding: 16px 52px 16px 16px;
  border: 1px solid var(--border);
  border-radius: var(--rb-r-card);
  background: var(--card);
  box-shadow: var(--rb-elev-1);
}

/* Cyan · brand blue · coral · amber blobs, masked so the left (text) side stays calm. */
.ar--static { padding-right: 16px; }

.ar__aura {
  position: absolute;
  inset: 0 -8% 0 38%;
  z-index: -1;
  background:
    radial-gradient(60% 75% at 100% 0%, color-mix(in srgb, var(--rb-glow) 80%, transparent), transparent 70%),
    radial-gradient(55% 70% at 72% 100%, color-mix(in srgb, var(--primary) 60%, transparent), transparent 72%),
    radial-gradient(45% 60% at 100% 100%, color-mix(in srgb, var(--rb-cta) 65%, transparent), transparent 70%),
    radial-gradient(40% 50% at 55% 10%, color-mix(in srgb, var(--rb-rating) 50%, transparent), transparent 70%);
  -webkit-mask-image: linear-gradient(to right, transparent, #000 45%);
  mask-image: linear-gradient(to right, transparent, #000 45%);
  animation: ar-drift 12s ease-in-out infinite alternate;
}

.ar__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--rb-r-icon);
  background: linear-gradient(150deg, var(--rb-glow), var(--primary));
  color: var(--primary-foreground);
  box-shadow: var(--rb-elev-2);
}

.ar__body {
  min-width: 0;
  flex: 1;
}

.ar__title {
  font-family: var(--rb-font-display);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--foreground);
}

.ar__text {
  margin-top: 4px;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--muted-foreground);
}

.ar__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  margin-top: 10px;
  padding: 0 16px;
  border-radius: var(--rb-r-chip);
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 13px;
  font-weight: 700;
  box-shadow: var(--rb-elev-2);
  transition: transform 0.15s ease;
}

.ar__cta:active { transform: scale(0.97); }

.ar__close {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--rb-r-chip);
  color: var(--foreground);
  opacity: 0.7;
  transition: opacity 0.15s ease, background-color 0.15s ease;
}

.ar__close:hover { opacity: 1; background: color-mix(in srgb, var(--card) 55%, transparent); }

.ar__cta:focus-visible,
.ar__close:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

@keyframes ar-drift {
  from { transform: translateX(0); }
  to { transform: translateX(-6%); }
}

@media (prefers-reduced-motion: reduce) {
  .ar__aura { animation: none; }
}
</style>
