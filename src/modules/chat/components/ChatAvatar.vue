<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  name: string
  src?: string | null
  /** Stable id → deterministic Telegram-style colour when there is no photo. */
  seed: number
}>()

// Telegram-like palette: one solid colour per user, picked by their id.
const PALETTE = [
  ['#e17076', '#ff8e86'], // red
  ['#ee9e57', '#ffc17a'], // orange
  ['#a695e7', '#c6b8ff'], // purple
  ['#7bc862', '#a0e88a'], // green
  ['#65aadd', '#8fd0ff'], // cyan/blue
  ['#ee7aae', '#ffa3cd'], // pink
  ['#6ec9cb', '#98e8ea'], // teal
] as const

const failed = ref(false)
watch(() => props.src, () => { failed.value = false })

const showImage = computed(() => !!props.src && !failed.value)

const initials = computed(() =>
  props.name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?',
)

const gradient = computed(() => {
  const [from, to] = PALETTE[Math.abs(props.seed) % PALETTE.length]!
  return `linear-gradient(135deg, ${from}, ${to})`
})
</script>

<template>
  <div
    class="chat-avatar"
    :style="showImage ? undefined : { backgroundImage: gradient }"
  >
    <img
      v-if="showImage"
      :src="src!"
      :alt="name"
      class="size-full object-cover"
      @error="failed = true"
    >
    <span v-else>{{ initials }}</span>
  </div>
</template>

<style scoped>
.chat-avatar {
  display: flex;
  height: 30px;
  width: 30px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  user-select: none;
}
</style>
