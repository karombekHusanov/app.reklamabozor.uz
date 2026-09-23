<script setup lang="ts">
import { ArrowRight, CheckCheck, FileEdit, FileSignature, Inbox, MessagesSquare } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'

/**
 * Request → result in five steps, driven by scroll: the rail fills as the
 * reader moves down, and each step switches on (icon lights up, card slides
 * in) the moment the fill reaches it. Reaching step 5 glows the CTA once.
 * Reduced motion → everything shown on, no scroll work.
 */
const emit = defineEmits<{ start: [] }>()

const locale = useLocaleStore()

const steps = computed(() => {
  const t = locale.t.landing
  return [
    { icon: FileEdit, title: t.j1Title, sub: t.j1Sub },
    { icon: Inbox, title: t.j2Title, sub: t.j2Sub },
    { icon: MessagesSquare, title: t.j3Title, sub: t.j3Sub },
    { icon: FileSignature, title: t.j4Title, sub: t.j4Sub },
    { icon: CheckCheck, title: t.j5Title, sub: t.j5Sub },
  ]
})

/** Viewport line (share of height from the top) that "reads" the steps. */
const READ_LINE = 0.62
/** Rail inset = icon centre (46px icon / 2). */
const RAIL_INSET = 23

const listRef = ref<HTMLOListElement | null>(null)
const fill = ref(0)
const activeCount = ref(0)
const finished = ref(false)

let frame = 0

function measure() {
  frame = 0
  const list = listRef.value
  if (!list) return

  const line = window.innerHeight * READ_LINE
  const rect = list.getBoundingClientRect()
  const span = Math.max(rect.height - RAIL_INSET * 2, 1)
  fill.value = Math.min(Math.max((line - rect.top - RAIL_INSET) / span, 0), 1)

  let on = 0
  for (const item of list.children) {
    if (item.getBoundingClientRect().top + RAIL_INSET <= line) on++
  }
  activeCount.value = on
  if (on === steps.value.length) finished.value = true
}

function onScroll() {
  if (!frame) frame = requestAnimationFrame(measure)
}

onMounted(() => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    fill.value = 1
    activeCount.value = steps.value.length
    finished.value = true
    return
  }
  measure()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (frame) cancelAnimationFrame(frame)
})
</script>

<template>
  <section
    class="jr"
    :aria-label="locale.t.landing.journeyTitle"
  >
    <span class="rb-eyebrow">{{ locale.t.landing.journeyEyebrow }}</span>
    <h2 class="rb-sec__title jr__title">
      {{ locale.t.landing.journeyTitle }}
    </h2>

    <ol
      ref="listRef"
      class="jr__list"
      :style="{ '--fill': fill }"
    >
      <li
        v-for="(step, i) in steps"
        :key="i"
        class="jr__item"
        :class="{ 'is-on': i < activeCount }"
      >
        <span
          class="jr__ic"
          aria-hidden="true"
        >
          <component
            :is="step.icon"
            class="size-[19px]"
          />
          <b>{{ i + 1 }}</b>
        </span>
        <div class="jr__body">
          <p class="jr__t">
            {{ step.title }}
          </p>
          <p class="jr__s">
            {{ step.sub }}
          </p>
        </div>
      </li>
    </ol>

    <button
      type="button"
      class="rb-primary-btn jr__cta"
      :class="{ 'is-ready': finished }"
      @click="emit('start')"
    >
      {{ locale.t.landing.journeyCta }}
      <ArrowRight class="size-4" />
    </button>
  </section>
</template>

<style scoped>
.jr__title { margin-top: 3px; }

.jr__list { position: relative; list-style: none; margin: 16px 0 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
/* Rail (::before) + scroll-linked fill (::after, scaled by --fill). */
.jr__list::before, .jr__list::after { content: ""; position: absolute; left: 22px; top: 23px; bottom: 23px; width: 2px; border-radius: 2px; }
.jr__list::before { background: var(--border); }
.jr__list::after {
  transform-origin: top; transform: scaleY(var(--fill, 0));
  background: linear-gradient(180deg, var(--rb-glow), var(--primary));
  box-shadow: 0 0 8px color-mix(in srgb, var(--rb-glow) 60%, transparent);
  transition: transform 120ms linear;
}

.jr__item { position: relative; display: flex; gap: 14px; align-items: flex-start; }

/* Idle step: quiet grey icon, card waiting off to the side. */
.jr__ic {
  position: relative; z-index: 1; flex-shrink: 0; width: 46px; height: 46px; border-radius: 15px; display: grid; place-items: center;
  color: var(--muted-foreground); background: var(--secondary); border: 1px solid var(--border);
  transition: color 300ms var(--rb-ease), background 300ms var(--rb-ease), box-shadow 300ms var(--rb-ease), transform 300ms var(--rb-ease);
}
.jr__ic b {
  position: absolute; top: -5px; right: -5px; width: 19px; height: 19px; border-radius: 999px; display: grid; place-items: center;
  background: var(--card); color: var(--muted-foreground); border: 1.5px solid var(--border);
  font-family: var(--rb-font-display); font-size: 10.5px; font-weight: 900;
  transition: color 300ms var(--rb-ease), border-color 300ms var(--rb-ease);
}
.jr__body {
  flex: 1; min-width: 0; padding: 12px 14px; background: var(--card); border: 1px solid var(--border); border-radius: var(--rb-r-tile);
  opacity: 0.45; transform: translateX(14px);
  transition: opacity 420ms var(--rb-ease), transform 420ms var(--rb-ease), box-shadow 420ms var(--rb-ease);
}

/* Active step: icon lights up with a small pop, card slides home. */
.jr__item.is-on .jr__ic {
  color: #fff; border-color: transparent;
  background: linear-gradient(150deg, var(--rb-glow) -30%, var(--primary) 70%);
  box-shadow: 0 9px 18px -9px color-mix(in srgb, var(--primary) 80%, transparent);
  animation: stepPop 420ms var(--rb-ease);
}
.jr__item.is-on .jr__ic b { color: var(--primary); border-color: color-mix(in srgb, var(--primary) 35%, var(--border)); }
.jr__item.is-on .jr__body { opacity: 1; transform: none; box-shadow: var(--rb-elev-1); }

.jr__t { margin: 0; font-family: var(--rb-font-display); font-weight: 800; font-size: 14.5px; letter-spacing: -0.01em; color: var(--foreground); }
.jr__s { margin: 3px 0 0; font-size: 12.5px; line-height: 1.45; color: var(--muted-foreground); }

.jr__cta { width: 100%; margin-top: 16px; }
.jr__cta.is-ready { animation: ctaGlow 1200ms var(--rb-ease) 1; }

@keyframes stepPop { 0% { transform: scale(0.9); } 55% { transform: scale(1.08); } 100% { transform: scale(1); } }
@keyframes ctaGlow {
  0% { box-shadow: 0 12px 24px -12px rgba(11, 107, 203, 0.6), 0 0 0 0 color-mix(in srgb, var(--primary) 45%, transparent); }
  60% { box-shadow: 0 12px 24px -12px rgba(11, 107, 203, 0.6), 0 0 0 10px color-mix(in srgb, var(--primary) 0%, transparent); }
  100% { box-shadow: 0 12px 24px -12px rgba(11, 107, 203, 0.6), 0 0 0 0 transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .jr__list::after, .jr__ic, .jr__body, .jr__ic b { transition: none; }
  .jr__item.is-on .jr__ic, .jr__cta.is-ready { animation: none; }
}
</style>
