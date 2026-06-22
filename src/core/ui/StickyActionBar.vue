<script setup lang="ts">
/**
 * Docks form actions (e.g. a submit button) to the bottom of the viewport while
 * scrolling a long form. Sits above the tab bar; in Telegram the WebView resizes
 * on keyboard open, so it stays above the keyboard while typing.
 */
</script>

<template>
  <div class="sticky bottom-20 z-20 pt-1">
    <slot />
  </div>
</template>
