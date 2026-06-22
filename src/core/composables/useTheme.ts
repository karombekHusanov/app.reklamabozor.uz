import { useTelegram } from '@/core/composables/useTelegram'
import { onMounted, watch } from 'vue'

export function useTheme() {
  const { colorScheme } = useTelegram()

  function applyTheme() {
    document.documentElement.classList.toggle('dark', colorScheme.value === 'dark')
  }

  onMounted(applyTheme)

  watch(colorScheme, applyTheme)
}
