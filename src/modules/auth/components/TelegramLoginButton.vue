<script setup lang="ts">
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { resolveTelegramUser } from '@/core/lib/telegram-init'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { Send } from '@lucide/vue'
import { ref } from 'vue'

const auth = useAuthStore()
const locale = useLocaleStore()
const { haptic } = useTelegram()

const isSubmitting = ref(false)

async function handleLogin() {
  const telegramUser = await resolveTelegramUser(2000)

  if (!telegramUser) {
    auth.error = locale.t.auth.loginOpenFromTelegram
    return
  }

  isSubmitting.value = true
  haptic('light')

  try {
    await auth.loginWithTelegram(telegramUser)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Button
    class="h-12 w-full rounded-2xl text-base"
    :disabled="isSubmitting || auth.isLoading"
    @click="handleLogin"
  >
    <Send class="size-4" />
    {{ isSubmitting || auth.isLoading ? locale.t.auth.loginSigningIn : locale.t.auth.loginContinue }}
  </Button>
</template>
