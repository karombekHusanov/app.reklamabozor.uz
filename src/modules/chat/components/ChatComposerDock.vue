<script setup lang="ts">
import { computed } from 'vue'
import { useKeyboardInset } from '@/core/composables/useKeyboardInset'

const { inset } = useKeyboardInset()

const dockStyle = computed(() => ({
  bottom: `${inset.value}px`,
}))
</script>

<template>
  <div
    class="chat-composer-dock"
    :style="dockStyle"
  >
    <slot />
  </div>
</template>
