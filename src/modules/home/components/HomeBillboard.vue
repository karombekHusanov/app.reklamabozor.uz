<script setup lang="ts">
/**
 * Tri-vision billboard — the real roadside kind: a row of triangular
 * prism slats that turn one after another to reveal the next ad. A prism
 * has three faces, but the face turning in from behind is re-painted with
 * the next creative, so the board cycles through any number of slides.
 *
 * Built with CSS 3D only: every slat is a prism whose three faces each show
 * that slat's vertical slice of one slide. The prism angle only ever grows
 * (step × 120°), so the board always turns the same way, like the real thing.
 * Reduced motion → a static first slide.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'

const locale = useLocaleStore()

/** Artwork hues (decorative, not UI — allowed literals per DESIGN_SYSTEM §2). */
const slides = computed(() => [
  {
    title: locale.t.home.billboardSlide1Title,
    sub: locale.t.home.billboardSlide1Sub,
    bg: 'linear-gradient(120deg, #0a4fa6 0%, #0b6bcb 45%, #25a5ee 100%)',
  },
  {
    title: locale.t.home.billboardSlide2Title,
    sub: locale.t.home.billboardSlide2Sub,
    bg: 'linear-gradient(120deg, #d9480f 0%, #f26b21 50%, #ffa94d 100%)',
  },
  {
    title: locale.t.home.billboardSlide3Title,
    sub: locale.t.home.billboardSlide3Sub,
    bg: 'linear-gradient(120deg, #03264a 0%, #0a4a86 55%, #0ea5c6 100%)',
  },
  {
    title: locale.t.home.billboardSlide4Title,
    sub: locale.t.home.billboardSlide4Sub,
    bg: 'linear-gradient(120deg, #2e1f7a 0%, #4f46e5 55%, #8b7cf6 100%)',
  },
])

const FACES = 3

/**
 * What each prism face shows at the current step: the front face (step), the
 * one turning in next (step + 1) and the one just turned away (step − 1).
 * Only the face at the back — never visible, even mid-turn — gets re-painted.
 */
const faces = computed(() => Array.from({ length: FACES }, (_, k) => {
  const t = [step.value - 1, step.value, step.value + 1]
    .find(n => ((n % FACES) + FACES) % FACES === k) ?? k
  return slides.value[((t % slides.value.length) + slides.value.length) % slides.value.length]!
}))

const SLATS = 12
const HOLD_MS = 4200
/** Face inset of an equilateral prism: w / (2·tan 60°). */
const APOTHEM = 1 / (2 * Math.tan(Math.PI / 3))

const screenRef = ref<HTMLElement | null>(null)
const boardW = ref(0)
const slatW = computed(() => boardW.value / SLATS)
const step = ref(0)

let timer: ReturnType<typeof setInterval> | null = null
let ro: ResizeObserver | null = null

function measure() {
  boardW.value = screenRef.value?.clientWidth ?? 0
}

onMounted(() => {
  measure()
  if (screenRef.value && 'ResizeObserver' in window) {
    ro = new ResizeObserver(measure)
    ro.observe(screenRef.value)
  }
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  timer = setInterval(() => {
    if (document.visibilityState === 'visible') step.value++
  }, HOLD_MS)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  ro?.disconnect()
})
</script>

<template>
  <div
    class="bb"
    aria-hidden="true"
  >
    <!-- lamp arms + the warm light they throw onto the face -->
    <div class="bb__lamps">
      <span
        v-for="n in 3"
        :key="n"
        class="bb__lamp"
      />
    </div>

    <div class="bb__frame">
      <div
        ref="screenRef"
        class="bb__screen"
      >
        <template v-if="boardW">
          <div
            v-for="i in SLATS"
            :key="i"
            class="bb__slat"
            :style="{ left: `${(i - 1) * slatW}px`, width: `${slatW + 0.5}px` }"
          >
            <div
              class="bb__prism"
              :style="{
                transform: `translateZ(${-slatW * APOTHEM}px) rotateY(${-120 * step}deg)`,
                transitionDelay: `${(i - 1) * 55}ms`,
              }"
            >
              <div
                v-for="(slide, k) in faces"
                :key="k"
                class="bb__face"
                :style="{ transform: `rotateY(${120 * k}deg) translateZ(${slatW * APOTHEM}px)` }"
              >
                <div
                  class="bb__art"
                  :style="{ width: `${boardW}px`, left: `${-(i - 1) * slatW}px`, background: slide.bg }"
                >
                  <p class="bb__title">
                    {{ slide.title }}
                  </p>
                  <p class="bb__sub">
                    {{ slide.sub }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>

        <span class="bb__light" />
        <span class="bb__gloss" />
      </div>
    </div>

    <div class="bb__post" />
  </div>
</template>

<style scoped>
.bb { position: relative; width: 100%; max-width: 360px; margin-inline: auto; }

/* ── lamps: slim arms on the top rail, each with a warm bulb ───────── */
.bb__lamps { position: relative; z-index: 3; display: flex; justify-content: space-around; padding-inline: 14%; height: 12px; }
.bb__lamp { position: relative; width: 22px; height: 12px; }
.bb__lamp::before { /* arm */
  content: ""; position: absolute; left: 50%; bottom: -2px; width: 2px; height: 12px; margin-left: -1px;
  background: linear-gradient(#5b6474, #2a303a);
}
.bb__lamp::after { /* head */
  content: ""; position: absolute; left: 0; top: 0; width: 22px; height: 6px; border-radius: 3px 3px 5px 5px;
  background: linear-gradient(#aeb6c4, #4b5463);
  box-shadow: 0 3px 6px -1px rgba(255, 226, 160, 0.9);
}

/* ── frame: dark metal bezel with a thin highlight rim ───────────────── */
.bb__frame {
  position: relative; z-index: 2; padding: 5px; border-radius: 9px;
  background: linear-gradient(180deg, #4a5261 0%, #1c2029 60%, #11141a 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 18px 30px -14px rgba(0, 0, 0, 0.7),
    0 0 40px -6px rgba(56, 189, 248, 0.35);
}

.bb__screen {
  position: relative; overflow: hidden; aspect-ratio: 2.85 / 1; border-radius: 5px; background: #0b1220;
  perspective: 700px; container-type: inline-size;
}

/* ── slats ─────────────────────────────────────────────────────────── */
.bb__slat { position: absolute; top: 0; bottom: 0; perspective: inherit; }
.bb__prism {
  position: absolute; inset: 0; transform-style: preserve-3d;
  transition: transform 900ms cubic-bezier(0.65, 0, 0.25, 1);
}
.bb__face { position: absolute; inset: 0; overflow: hidden; backface-visibility: hidden; }
/* facet shading + the hairline seam between slats */
.bb__face::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.16) 0, transparent 18%, transparent 82%, rgba(255, 255, 255, 0.06) 100%);
  box-shadow: inset -0.5px 0 0 rgba(0, 0, 0, 0.35);
}

.bb__art {
  position: absolute; top: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 0 7%; text-align: center; color: #fff;
}
.bb__title {
  margin: 0; font-family: var(--rb-font-display); font-weight: 900; line-height: 1.05; letter-spacing: -0.02em; text-wrap: balance;
  font-size: 20px; font-size: 6.4cqw; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}
.bb__sub { margin: 5px 0 0; font-weight: 600; opacity: 0.9; font-size: 11.5px; font-size: 3.7cqw; }

/* lamp light pooling on the upper face, and a slow glass sheen */
.bb__light {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(40% 70% at 22% -12%, rgba(255, 236, 190, 0.32), transparent 70%),
    radial-gradient(40% 70% at 50% -12%, rgba(255, 236, 190, 0.32), transparent 70%),
    radial-gradient(40% 70% at 78% -12%, rgba(255, 236, 190, 0.32), transparent 70%);
  mix-blend-mode: soft-light;
}
.bb__gloss {
  position: absolute; top: 0; bottom: 0; left: -40%; width: 30%; pointer-events: none;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.16), transparent);
  transform: skewX(-18deg); animation: bbSheen 7s ease-in-out infinite;
}

/* ── single post fading into the hero ──────────────────────────────── */
.bb__post {
  position: relative; z-index: 1; width: 16px; height: 26px; margin: -1px auto 0;
  background: linear-gradient(90deg, #1b2029, #5b6474 45%, #1b2029);
  -webkit-mask: linear-gradient(#000 30%, transparent);
  mask: linear-gradient(#000 30%, transparent);
}

@keyframes bbSheen {
  0%, 55% { transform: translateX(0) skewX(-18deg); }
  100% { transform: translateX(560%) skewX(-18deg); }
}

@media (prefers-reduced-motion: reduce) {
  .bb__prism { transition: none; }
  .bb__gloss { animation: none; display: none; }
}
</style>
