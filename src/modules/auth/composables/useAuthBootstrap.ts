import { useTheme } from '@/core/composables/useTheme'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { onBeforeMount } from 'vue'

export function useAuthBootstrap() {
  const auth = useAuthStore()

  useTheme()

  onBeforeMount(() => {
    void auth.bootstrapTelegramAuth()
  })
}
