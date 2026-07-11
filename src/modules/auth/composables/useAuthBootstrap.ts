import { useTheme } from '@/core/composables/useTheme'
import { useThemeStore } from '@/core/stores/theme.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { onBeforeMount } from 'vue'

export function useAuthBootstrap() {
  const auth = useAuthStore()
  const locale = useLocaleStore()

  useTheme()

  onBeforeMount(() => {
    void locale.hydrate()
    void useThemeStore().hydrate()
    void auth.bootstrapTelegramAuth()
  })
}
