import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Paint the whole app canvas white while a page is open (chat threads) — the
 * default tinted canvas would otherwise show wherever the content is short.
 */
export function useWhiteCanvas() {
  onMounted(() => document.documentElement.classList.add('canvas-white'))
  onBeforeUnmount(() => document.documentElement.classList.remove('canvas-white'))
}
