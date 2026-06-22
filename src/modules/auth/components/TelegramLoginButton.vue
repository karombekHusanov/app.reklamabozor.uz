<script setup lang="ts">
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { resolveTelegramUser } from '@/core/lib/telegram-init'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { Send } from '@lucide/vue'
import { ref } from 'vue'

const auth = useAuthStore()
const { haptic } = useTelegram()

const isSubmitting = ref(false)

async function handleLogin() {
  const telegramUser = await resolveTelegramUser(2000)

  if (!telegramUser) {
    auth.error = 'Open this app from Telegram to sign in.'
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
    {{ isSubmitting || auth.isLoading ? 'Signing in...' : 'Continue with Telegram' }}
  </Button>
</template>
