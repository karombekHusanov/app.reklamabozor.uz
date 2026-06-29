import { onMounted } from 'vue'

/**
 * Reklama Bozor uses a single fixed branded scheme — a dark-blue background with
 * light cards — so we never follow Telegram's light/dark colour scheme. The `.dark`
 * class is always kept off so the light card tokens apply on top of the blue bg.
 */
export function useTheme() {
  onMounted(() => {
    document.documentElement.classList.remove('dark')
  })
}
