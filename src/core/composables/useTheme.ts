import WebApp from '@twa-dev/sdk'
import { onMounted } from 'vue'

/** Follow Telegram's light/dark colour scheme so the app feels native inside the WebView. */
export function useTheme() {
  function apply(scheme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', scheme === 'dark')
  }

  onMounted(() => {
    apply(WebApp.colorScheme === 'dark' ? 'dark' : 'light')

    try {
      WebApp.onEvent('themeChanged', () => {
        apply(WebApp.colorScheme === 'dark' ? 'dark' : 'light')
      })
    }
    catch {
      // old client — static scheme from first paint is fine
    }
  })
}
