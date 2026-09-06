<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Fully code-built billboard — no photo. An SVG scene draws the physical
 * structure (sky, clouds, metal frame, support legs, catwalk, spotlights) and
 * the rotating ad creatives are perspective-mapped (rect -> the 4 screen
 * corners) onto the display panel. The geometry is authored here (a gentle,
 * readable recede), so each creative is a full-bleed poster with a legible
 * headline instead of type crushed into a far edge.
 */

interface Slide {
  lines: string[]
  /** full-panel poster background */
  bg: string
}

const slides: Slide[] = [
  {
    lines: ['PRB —', 'ishonchli tanlov'],
    bg: 'linear-gradient(135deg, #ff5a3c 0%, #ff7a45 50%, #ffb347 100%)',
  },
  {
    lines: ['Endi hech kim', 'sizni alday olmaydi'],
    bg: 'linear-gradient(135deg, #04252e 0%, #0b5566 55%, #12a4c4 100%)',
  },
  {
    lines: ['Tezlik · Shaffoflik', 'Ishonchlilik'],
    bg: 'linear-gradient(135deg, #3a1d8a 0%, #5a2fd0 50%, #16c7e6 100%)',
  },
  {
    lines: ['Reklamangiz', 'shu yerda'],
    bg: 'linear-gradient(135deg, #c9145a 0%, #ff3b6b 50%, #ff8a5c 100%)',
  },
]

const active = ref(0)
let cycle: ReturnType<typeof setInterval> | null = null

/**
 * Inner display-surface corners (fractions of the box), TL, TR, BL, BR.
 * Kept in lock-step with the SVG panel quad below. A gentle recede to the
 * right — readable, still clearly 3D.
 */
const CORNERS: Array<[number, number]> = [
  [0.100, 0.108],
  [0.902, 0.196],
  [0.100, 0.572],
  [0.902, 0.500],
]
const BASE_W = 320
const BASE_H = 176

const root = ref<HTMLElement | null>(null)
const screenEl = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null

/* --- rect -> quad homography -> CSS matrix3d (Paul Bourke method) --- */
function adj(m: number[]): number[] {
  return [
    m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
  ]
}
function mulmm(a: number[], b: number[]): number[] {
  const c = new Array<number>(9)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let s = 0
      for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j]
      c[3 * i + j] = s
    }
  }
  return c
}
function mulmv(m: number[], v: number[]): number[] {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ]
}
function basisToPoints(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): number[] {
  const m = [x1, x2, x3, y1, y2, y3, 1, 1, 1]
  const v = mulmv(adj(m), [x4, y4, 1])
  return mulmm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]])
}

function applyMatrix() {
  const el = root.value
  const sc = screenEl.value
  if (!el || !sc) return
  const w = el.clientWidth
  const h = el.clientHeight
  if (!w || !h) return
  const d = CORNERS.map(([fx, fy]) => [fx * w, fy * h] as [number, number])
  const s = basisToPoints(0, 0, BASE_W, 0, 0, BASE_H, BASE_W, BASE_H)
  const dm = basisToPoints(d[0][0], d[0][1], d[1][0], d[1][1], d[2][0], d[2][1], d[3][0], d[3][1])
  let t = mulmm(dm, adj(s))
  t = t.map(v => v / t[8])
  const m = [t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]]
  sc.style.transform = `matrix3d(${m.join(',')})`
}

onMounted(() => {
  applyMatrix()
  ro = new ResizeObserver(applyMatrix)
  if (root.value) ro.observe(root.value)
  cycle = setInterval(() => {
    active.value = (active.value + 1) % slides.length
  }, 2800)
})
onBeforeUnmount(() => {
  if (cycle) clearInterval(cycle)
  if (ro) ro.disconnect()
})
</script>

<template>
  <div
    ref="root"
    class="billboard"
    aria-hidden="true"
  >
    <!-- code-built structure: sky, clouds, frame, legs, catwalk, spotlights -->
    <svg
      class="billboard__scene"
      viewBox="0 0 900 654"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bbSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1663c6" />
          <stop offset="0.5" stop-color="#3f8ee6" />
          <stop offset="1" stop-color="#a9d2f5" />
        </linearGradient>
        <!-- soft sun glow, upper-left (like the original photo) -->
        <radialGradient id="bbSun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.95" />
          <stop offset="0.35" stop-color="#eaf5ff" stop-opacity="0.5" />
          <stop offset="1" stop-color="#eaf5ff" stop-opacity="0" />
        </radialGradient>
        <!-- real-life fractal-noise clouds -->
        <filter id="bbClouds" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.015" numOctaves="4" seed="17" stitchTiles="stitch" result="turb" />
          <feColorMatrix
            in="turb"
            type="matrix"
            values="0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 1.5 -0.62"
          />
        </filter>
        <linearGradient id="bbFrame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#3a4150" />
          <stop offset="0.5" stop-color="#565e6e" />
          <stop offset="1" stop-color="#232833" />
        </linearGradient>
        <linearGradient id="bbMetal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#c7cfdb" />
          <stop offset="0.5" stop-color="#9aa4b4" />
          <stop offset="1" stop-color="#6b7484" />
        </linearGradient>
        <radialGradient id="bbCone" cx="0.5" cy="0" r="1">
          <stop offset="0" stop-color="#fffbe6" stop-opacity="0.5" />
          <stop offset="1" stop-color="#fffbe6" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- sky + real-life clouds + sun glow -->
      <rect x="0" y="0" width="900" height="654" fill="url(#bbSky)" />
      <rect x="0" y="0" width="900" height="654" filter="url(#bbClouds)" opacity="0.9" />
      <ellipse cx="205" cy="185" rx="360" ry="300" fill="url(#bbSun)" />

      <!-- support legs -->
      <g fill="url(#bbMetal)" stroke="#5a6270" stroke-width="2">
        <polygon points="250,404 300,408 292,654 240,654" />
        <polygon points="596,384 642,388 652,654 606,654" />
      </g>
      <!-- cross braces -->
      <g stroke="#5b6472" stroke-width="7" opacity="0.9">
        <line x1="298" y1="470" x2="606" y2="600" />
        <line x1="600" y1="466" x2="292" y2="600" />
      </g>

      <!-- catwalk / walkway -->
      <polygon points="70,392 828,346 828,376 58,424" fill="url(#bbMetal)" stroke="#4a5260" stroke-width="2" />
      <!-- railing -->
      <line x1="70" y1="386" x2="828" y2="340" stroke="#cdd5e0" stroke-width="4" />
      <g stroke="#aab3c0" stroke-width="2.5">
        <line x1="150" y1="384" x2="152" y2="410" />
        <line x1="300" y1="375" x2="302" y2="404" />
        <line x1="450" y1="366" x2="452" y2="398" />
        <line x1="600" y1="357" x2="602" y2="392" />
        <line x1="750" y1="348" x2="752" y2="386" />
      </g>

      <!-- spotlights: light cones toward the panel + lamp heads -->
      <g>
        <polygon points="200,392 150,150 320,150" fill="url(#bbCone)" />
        <polygon points="430,378 400,150 560,150" fill="url(#bbCone)" />
        <polygon points="660,362 640,150 800,160" fill="url(#bbCone)" />
      </g>
      <g fill="#2c313c">
        <rect x="188" y="384" width="26" height="14" rx="3" transform="rotate(-6 201 391)" />
        <rect x="418" y="370" width="26" height="14" rx="3" transform="rotate(-6 431 377)" />
        <rect x="648" y="354" width="26" height="14" rx="3" transform="rotate(-6 661 361)" />
      </g>

      <!-- billboard frame (dark border quad; the HTML poster fills the inner) -->
      <polygon points="72,52 828,112 828,344 72,392" fill="url(#bbFrame)" stroke="#1b1f27" stroke-width="3" />
      <!-- inner bezel -->
      <polygon points="90,70 811,126 811,330 90,376" fill="#11151c" />
    </svg>

    <!-- ad surface (perspective-mapped onto the panel) -->
    <div
      ref="screenEl"
      class="billboard__screen"
    >
      <div
        v-for="(slide, i) in slides"
        :key="i"
        class="creative"
        :class="{ 'creative--on': i === active }"
        :data-anim="i"
        :style="{ background: slide.bg }"
      >
        <!-- readability scrim over the poster, densest on the near (left) side -->
        <span class="creative__scrim" />
        <span class="creative__text">
          <b
            v-for="(line, li) in slide.lines"
            :key="li"
            :class="{ 'creative__punch': li === slide.lines.length - 1 }"
          >{{ line }}</b>
        </span>
      </div>
    </div>

    <!-- periodic light glint across the whole board -->
    <span class="billboard__sweep" />
  </div>
</template>

<style scoped>
.billboard {
  position: relative;
  width: 100%;
  aspect-ratio: 900 / 654;
  border-radius: 16px;
  overflow: hidden;
}
.billboard__scene { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

.billboard__screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 320px;
  height: 176px;
  transform-origin: 0 0;
  overflow: hidden;
}

/* each creative is a full-bleed poster filling the whole mapped panel */
.creative {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.5s ease;
}
.creative--on { opacity: 1; animation: cvFade 0.65s both; }
.creative[data-anim="1"].creative--on { animation-name: cvUp; }
.creative[data-anim="2"].creative--on { animation-name: cvRight; }
.creative[data-anim="3"].creative--on { animation-name: cvWipe; }
.creative[data-anim="4"].creative--on { animation-name: cvFlip; }

/* darken the near/left half so white type stays legible on any poster bg */
.creative__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.22) 42%, rgba(0, 0, 0, 0) 72%);
}

/*
 * Headline lives in the NEAR (left) half of the flat surface. After the
 * homography the near side is large, so type reads at full size instead of
 * being crushed into the far edge. Left-anchored + left-aligned = a real
 * poster composition, not a hack-nudged centre.
 */
.creative__text {
  position: absolute;
  left: 7%;
  right: 30%;
  top: 12%;
  bottom: 12%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 3px;
  text-align: left;
}
.creative b {
  font-family: var(--rb-font-display);
  font-weight: 700;
  font-size: 19px;
  line-height: 1.08;
  letter-spacing: 0;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55), 0 1px 1px rgba(0, 0, 0, 0.4);
}
.creative__punch {
  font-weight: 800;
  font-size: 25px;
}

.billboard__sweep {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(114deg, transparent 40%, rgba(255, 255, 255, 0.45) 50%, transparent 60%);
  transform: translateX(-130%);
  animation: bbSweep 7.5s ease-in-out infinite 1.4s;
}

@keyframes cvFade { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: none; } }
@keyframes cvUp { from { opacity: 0; transform: translateY(30%); } to { opacity: 1; transform: none; } }
@keyframes cvRight { from { opacity: 0; transform: translateX(30%); } to { opacity: 1; transform: none; } }
@keyframes cvWipe { from { opacity: 1; clip-path: inset(0 0 100% 0); } to { opacity: 1; clip-path: inset(0 0 0 0); } }
@keyframes cvFlip { from { opacity: 0.2; transform: perspective(300px) rotateX(90deg); transform-origin: center top; } to { opacity: 1; transform: none; } }
@keyframes bbSweep { 0% { transform: translateX(-130%); } 55%, 100% { transform: translateX(140%); } }

@media (prefers-reduced-motion: reduce) {
  .creative--on, .billboard__sweep { animation: none !important; }
}
</style>
