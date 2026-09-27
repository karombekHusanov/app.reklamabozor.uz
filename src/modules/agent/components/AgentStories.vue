<script setup lang="ts">
import { ArrowRight, X } from '@lucide/vue'
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { readPref, writePref } from '@/core/lib/cloud-prefs'
import { AGENT_STORIES } from '@/modules/agent/lib/agent-stories'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

/**
 * Instagram-style stories: a rail of ringed circles (gradient ring = unseen),
 * tapping one opens a full-screen viewer with auto-advancing progress bars,
 * tap right/left to step, and a CTA per story.
 */
const SLIDE_MS = 5000
const TICK_MS = 50

const locale = useLocaleStore()
const router = useRouter()
const { haptic } = useTelegram()
const auth = useAuthStore()
// Per account: prefs are shared between Telegram accounts on one device.
const SEEN_KEY = `adspace_agent_stories_seen_${auth.user?.id ?? 0}`

function readSeen(): string[] {
  try { return JSON.parse(readPref(SEEN_KEY) ?? '[]') as string[] }
  catch { return [] }
}
const seen = ref<string[]>(readSeen())

const stories = computed(() => AGENT_STORIES.map(def => ({ ...def, ...locale.t.agentHome.stories[def.id] })))

const active = ref(-1)
const slide = ref(0)
const progress = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const current = computed(() => (active.value >= 0 ? stories.value[active.value] : null))

function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

function tick() {
  progress.value += TICK_MS / SLIDE_MS
  if (progress.value >= 1) next()
}

function open(index: number) {
  active.value = index
  slide.value = 0
  progress.value = 0
  const id = stories.value[index]!.id
  if (!seen.value.includes(id)) {
    seen.value = [...seen.value, id]
    writePref(SEEN_KEY, JSON.stringify(seen.value))
  }
  if (!timer) timer = setInterval(tick, TICK_MS)
}

function close() {
  stop()
  active.value = -1
}

function next() {
  const story = current.value
  if (!story) return
  if (slide.value < story.slides.length - 1) {
    slide.value++
    progress.value = 0
  }
  else if (active.value < stories.value.length - 1) open(active.value + 1)
  else close()
}

function prev() {
  if (slide.value > 0) slide.value--
  else if (active.value > 0) open(active.value - 1)
  progress.value = 0
}

function openStory(index: number) {
  haptic('light')
  open(index)
}

function cta() {
  const to = current.value?.to
  close()
  if (to) void router.push(to)
}

function barFill(index: number): string {
  const value = index < slide.value ? 1 : index === slide.value ? progress.value : 0
  return `${Math.min(value, 1) * 100}%`
}

onBeforeUnmount(stop)
</script>

<template>
  <div class="st-rail">
    <button
      v-for="(story, i) in stories"
      :key="story.id"
      type="button"
      class="st-item"
      :class="{ 'is-seen': seen.includes(story.id) }"
      @click="openStory(i)"
    >
      <span class="st-ring">
        <span
          class="st-circle"
          :style="{ background: story.bg }"
        >
          <component
            :is="story.icon"
            class="size-6 text-white"
          />
        </span>
      </span>
      <span class="st-label">{{ story.label }}</span>
    </button>
  </div>

  <Teleport to="body">
    <Transition name="st-fade">
      <div
        v-if="current"
        class="st-viewer"
        role="dialog"
        aria-modal="true"
        :aria-label="current.label"
      >
        <div
          class="st-card"
          :style="{ background: current.bg }"
        >
          <div class="st-bars">
            <span
              v-for="(_, i) in current.slides"
              :key="i"
              class="st-bar"
            ><span
              class="st-bar__fill"
              :style="{ width: barFill(i) }"
            /></span>
          </div>

          <div class="st-head">
            <span class="st-head__av"><component
              :is="current.icon"
              class="size-[18px] text-white"
            /></span>
            <span class="st-head__id">
              <span class="st-head__name">{{ current.label }}</span>
              <span class="st-head__from">{{ locale.t.agentHome.storyFrom }}</span>
            </span>
            <button
              type="button"
              class="st-close"
              :aria-label="locale.t.agentHome.storyClose"
              @click="close"
            >
              <X class="size-6" />
            </button>
          </div>

          <button
            type="button"
            class="st-zone st-zone--prev"
            :aria-label="locale.t.agentHome.storyPrev"
            @click="prev"
          />
          <button
            type="button"
            class="st-zone st-zone--next"
            :aria-label="locale.t.agentHome.storyNext"
            @click="next"
          />

          <div class="st-body">
            <span class="st-step">{{ slide + 1 }} / {{ current.slides.length }}</span>
            <p class="st-title">
              {{ current.slides[slide]?.[0] }}
            </p>
            <p class="st-text">
              {{ current.slides[slide]?.[1] }}
            </p>
          </div>

          <button
            type="button"
            class="st-cta"
            @click="cta"
          >
            {{ current.cta }}
            <ArrowRight class="size-[18px]" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.st-rail { display: flex; gap: 10px; overflow-x: auto; padding: 4px 16px 6px; scrollbar-width: none; }
.st-rail::-webkit-scrollbar { display: none; }
.st-item {
  flex-shrink: 0; width: 64px; display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 0; border: 0; background: none; color: var(--foreground); font-family: inherit; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.st-item:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 12px; }
.st-ring {
  display: flex; width: 62px; height: 62px; padding: 2.5px; box-sizing: border-box; border-radius: 999px;
  background: linear-gradient(45deg, #feda75, #fa7e1e 30%, #d62976 60%, #962fbf 80%, #4f5bd5);
}
.is-seen .st-ring { background: var(--border); }
.st-circle { flex: 1; display: grid; place-items: center; border-radius: 999px; border: 2.5px solid var(--background); }
.st-label { width: 64px; font-size: 10.5px; line-height: 1.2; font-weight: 600; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.is-seen .st-label { font-weight: 500; color: var(--muted-foreground); }

.st-viewer {
  position: fixed; inset: 0; z-index: 120; display: flex; background: #000;
  padding: max(env(safe-area-inset-top), 10px) 8px max(env(safe-area-inset-bottom), 14px);
}
.st-card { position: relative; flex: 1; display: flex; flex-direction: column; overflow: hidden; border-radius: 18px; color: #fff; }
.st-bars { position: relative; z-index: 3; display: flex; gap: 4px; padding: 12px 12px 0; }
.st-bar { flex: 1; height: 3px; overflow: hidden; border-radius: 999px; background: rgba(255, 255, 255, 0.35); }
.st-bar__fill { display: block; height: 100%; background: #fff; }
.st-head { position: relative; z-index: 3; display: flex; align-items: center; gap: 10px; padding: 12px 8px 0 14px; }
.st-head__av { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 999px; border: 2px solid rgba(255, 255, 255, 0.8); background: rgba(255, 255, 255, 0.18); }
.st-head__id { flex: 1; display: flex; flex-direction: column; }
.st-head__name { font-size: 13px; font-weight: 700; }
.st-head__from { font-size: 11px; opacity: 0.75; }
.st-close { display: grid; place-items: center; width: 44px; height: 44px; border: 0; background: none; color: #fff; cursor: pointer; }
.st-zone { position: absolute; z-index: 2; top: 90px; bottom: 110px; border: 0; background: transparent; cursor: pointer; }
.st-zone--prev { left: 0; width: 35%; }
.st-zone--next { right: 0; width: 65%; }
.st-body { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; justify-content: flex-end; padding: 0 20px 22px; }
.st-step { font-family: var(--rb-font-display); font-size: 11px; font-weight: 800; letter-spacing: 0.12em; opacity: 0.8; }
.st-title { margin: 8px 0 0; font-family: var(--rb-font-display); font-size: 25px; font-weight: 900; line-height: 1.05; letter-spacing: -0.02em; }
.st-text { margin: 10px 0 0; font-size: 15px; line-height: 1.45; opacity: 0.95; }
.st-cta {
  position: relative; z-index: 3; margin: 0 16px 16px; min-height: 50px; display: flex; align-items: center; justify-content: center; gap: 8px;
  border: 0; border-radius: var(--rb-r-field); background: #fff; color: #101828; font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer;
}
.st-fade-enter-active, .st-fade-leave-active { transition: opacity 200ms ease, transform 200ms ease; }
.st-fade-enter-from, .st-fade-leave-to { opacity: 0; transform: scale(0.97); }
@media (prefers-reduced-motion: reduce) {
  .st-fade-enter-active, .st-fade-leave-active { transition: none; }
}
</style>
