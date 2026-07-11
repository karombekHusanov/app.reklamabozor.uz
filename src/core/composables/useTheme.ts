import { onMounted } from 'vue'
import { useThemeStore } from '@/core/stores/theme.store'

/** Applies the user theme preference and keeps "auto" in sync with Telegram. */
export function useTheme() {
  const theme = useThemeStore()

  onMounted(() => {
    theme.init()
  })
}
