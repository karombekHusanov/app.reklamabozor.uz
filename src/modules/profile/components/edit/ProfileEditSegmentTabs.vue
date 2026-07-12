<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'

type TabKey = string

const props = defineProps<{
  tabs: Array<{ key: TabKey, label: string }>
}>()

const activeTab = defineModel<TabKey>({ required: true })

const segmentRef = ref<HTMLElement | null>(null)
const scrollRef = ref<HTMLElement | null>(null)
const pillWidth = ref(0)
const pillOffset = ref(0)
const pillReady = ref(false)

function updatePill() {
  const track = segmentRef.value
  if (!track) return

  const buttons = track.querySelectorAll<HTMLButtonElement>('[data-profile-edit-tab]')
  const index = props.tabs.findIndex(tab => tab.key === activeTab.value)
  const button = buttons[index]

  if (!button) {
    pillReady.value = false
    return
  }

  pillWidth.value = button.offsetWidth
  pillOffset.value = button.offsetLeft
  pillReady.value = true
}

function scrollActiveTabIntoView() {
  const scroller = scrollRef.value
  const track = segmentRef.value
  if (!scroller || !track) return

  const index = props.tabs.findIndex(tab => tab.key === activeTab.value)
  const button = track.querySelectorAll<HTMLButtonElement>('[data-profile-edit-tab]')[index]
  if (!button) return

  const padding = 8
  const targetLeft = button.offsetLeft - padding
  const targetRight = button.offsetLeft + button.offsetWidth + padding
  const viewLeft = scroller.scrollLeft
  const viewRight = viewLeft + scroller.clientWidth

  if (targetLeft < viewLeft) {
    scroller.scrollTo({ left: targetLeft, behavior: 'smooth' })
  }
  else if (targetRight > viewRight) {
    scroller.scrollTo({ left: targetRight - scroller.clientWidth, behavior: 'smooth' })
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  void nextTick(() => {
    updatePill()
    scrollActiveTabIntoView()
  })

  if (typeof ResizeObserver !== 'undefined' && segmentRef.value) {
    resizeObserver = new ResizeObserver(() => updatePill())
    resizeObserver.observe(segmentRef.value)
  }

  window.addEventListener('resize', updatePill)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updatePill)
})

watch(activeTab, () => {
  void nextTick(() => {
    updatePill()
    scrollActiveTabIntoView()
  })
})

watch(() => props.tabs, () => {
  void nextTick(updatePill)
}, { deep: true })
</script>

<template>
  <div class="profile-edit-tabs-sticky">
    <div
      ref="scrollRef"
      class="profile-edit-tabs-scroll"
    >
      <GlassCard
        frosted
        padding="xs"
        class="profile-edit-tabs-card"
      >
        <div
          ref="segmentRef"
          class="profile-edit-segment glass-segment"
        >
          <span
            class="glass-segment-active"
            :class="!pillReady && 'no-anim'"
            :style="{
              width: `${pillWidth}px`,
              transform: `translateX(${pillOffset}px)`,
              opacity: pillReady ? 1 : 0,
            }"
          />

          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            data-profile-edit-tab
            class="profile-edit-segment__btn pressable"
            :class="activeTab === tab.key && 'profile-edit-segment__btn--active'"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </GlassCard>
    </div>
  </div>
</template>
