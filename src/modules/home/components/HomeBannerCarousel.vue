<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { trackBannerClick, trackBannerView, type Banner } from '@/modules/home/services/banners.service'
import { ROUTES } from '@/modules/shell/constants/routes'

const props = defineProps<{ banners: Banner[] }>()

const AUTOPLAY_MS = 3000

const locale = useLocaleStore()
const router = useRouter()

const slides = computed(() => {
  if (props.banners.length > 0) {
    return props.banners.map(b => ({
      key: `b${b.id}`,
      banner: b,
      title: b.title,
      subtitle: b.subtitle,
      image: b.image,
    }))
  }

  return locale.t.home.bannerDefaults.map((title: string, i: number) => ({
    key: `d${i}`,
    banner: null,
    title,
    subtitle: null,
    image: null,
  }))
})

const active = ref(0)
const paused = ref(false)
const reduced = ref(false)
let timer: ReturnType<typeof setInterval> | null = null
const viewed = new Set<number>()

function trackView() {
  const slide = slides.value[active.value]
  if (slide?.banner && !viewed.has(slide.banner.id)) {
    viewed.add(slide.banner.id)
    trackBannerView(slide.banner.id)
  }
}

function go(index: number) {
  const n = slides.value.length
  active.value = ((index % n) + n) % n
}

function stop() {
  if (timer != null) {
    clearInterval(timer)
    timer = null
  }
}

function start() {
  stop()
  if (reduced.value || paused.value || slides.value.length < 2) return
  timer = setInterval(() => go(active.value + 1), AUTOPLAY_MS)
}

watch([paused, () => slides.value.length], start)
watch(active, trackView)
watch(() => props.banners, () => {
  active.value = 0
  trackView()
})

let mq: MediaQueryList | null = null
function onMotionChange() {
  reduced.value = !!mq?.matches
  start()
}

onMounted(() => {
  mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduced.value = mq.matches
  mq.addEventListener('change', onMotionChange)
  trackView()
  start()
})

onBeforeUnmount(() => {
  stop()
  mq?.removeEventListener('change', onMotionChange)
})

function open(index: number) {
  const banner = slides.value[index]?.banner
  if (!banner) {
    void router.push(ROUTES.newOrder)
    return
  }

  trackBannerClick(banner.id)
  if (banner.type === 'agent' && banner.target_id) {
    void router.push(`/agents/${banner.target_id}`)
  }
  else if (banner.type === 'link' && banner.link_url) {
    window.open(banner.link_url, '_blank', 'noopener')
  }
}

// Swipe: pause while touching, flip on a clear horizontal drag.
let startX = 0
function onTouchStart(e: TouchEvent) {
  paused.value = true
  startX = e.touches[0]?.clientX ?? 0
}
function onTouchEnd(e: TouchEvent) {
  const dx = (e.changedTouches[0]?.clientX ?? 0) - startX
  if (Math.abs(dx) > 40) go(active.value + (dx < 0 ? 1 : -1))
  paused.value = false
}
</script>

<template>
  <section
    class="bc"
    role="region"
    aria-roledescription="carousel"
    :aria-label="locale.t.home.bannerRegion"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
    @touchcancel.passive="paused = false"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
    @focusin="paused = true"
    @focusout="paused = false"
  >
    <div class="bc__viewport">
      <div
        class="bc__track"
        :style="{ transform: `translateX(-${active * 100}%)` }"
      >
        <button
          v-for="(slide, i) in slides"
          :key="slide.key"
          type="button"
          class="bc__slide"
          :class="{ 'bc__slide--image': slide.image }"
          :aria-hidden="i !== active ? 'true' : undefined"
          :tabindex="i === active ? 0 : -1"
          :style="slide.image ? { backgroundImage: `url(${slide.image})` } : undefined"
          @click="open(i)"
        >
          <span
            v-if="slide.title"
            class="bc__title"
          >{{ slide.title }}</span>
          <span
            v-if="slide.subtitle"
            class="bc__sub"
          >{{ slide.subtitle }}</span>
        </button>
      </div>
    </div>

    <div
      v-if="slides.length > 1"
      class="bc__dots"
    >
      <button
        v-for="(slide, i) in slides"
        :key="slide.key"
        type="button"
        class="bc__dot"
        :class="{ 'bc__dot--on': i === active }"
        :aria-label="locale.t.home.bannerSlide.replace('{n}', String(i + 1))"
        :aria-current="i === active ? 'true' : undefined"
        @click="go(i)"
      />
    </div>
  </section>
</template>

<style scoped>
.bc__viewport {
  overflow: hidden;
  border-radius: var(--rb-r-card);
  border: 1px solid var(--border);
  background: var(--card);
  box-shadow: var(--rb-elev-1);
}
.bc__track {
  display: flex;
  transition: transform var(--rb-dur-slow) var(--rb-ease);
}
.bc__slide {
  display: flex;
  flex: 0 0 100%;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-height: 112px;
  padding: 18px 20px;
  border: 0;
  background: var(--card) center / cover no-repeat;
  color: var(--foreground);
  text-align: left;
  cursor: pointer;
}
.bc__slide:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -3px;
}
.bc__slide--image {
  color: #fff;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.55);
}
.bc__title {
  font-family: var(--rb-font-display);
  font-size: 17px;
  font-weight: 800;
  line-height: 1.25;
}
.bc__sub {
  font-size: 12.5px;
  color: var(--muted-foreground);
}
.bc__slide--image .bc__sub { color: inherit; }

.bc__dots {
  display: flex;
  justify-content: center;
  gap: 0;
  margin-top: -6px;
  margin-bottom: -8px;
}
/* 44px hit area around a small visual dot */
.bc__dot {
  position: relative;
  width: 44px;
  height: 44px;
  border: 0;
  background: none;
  cursor: pointer;
}
.bc__dot::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--border);
  transform: translate(-50%, -50%);
  transition: width var(--rb-dur) var(--rb-ease), background var(--rb-dur) var(--rb-ease);
}
.bc__dot--on::after {
  width: 18px;
  background: var(--primary);
}
.bc__dot:focus-visible {
  outline: 2px solid var(--primary);
  border-radius: 999px;
}

@media (prefers-reduced-motion: reduce) {
  .bc__track, .bc__dot::after { transition: none; }
}
</style>
