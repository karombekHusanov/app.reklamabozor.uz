<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAuthBootstrap } from '@/modules/auth'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import Toaster from '@/core/ui/Toaster.vue'
import { parseOrderStartParam, readTelegramStartParam } from '@/core/lib/telegram-init'
import { SplashScreen, OnboardingFlow, useOnboardingStore } from '@/modules/onboarding'

useAuthBootstrap()

const router = useRouter()
const auth = useAuthStore()
const onboarding = useOnboardingStore()

// Launch splash: hold for a minimum beat, and until Telegram auth settles so the
// onboarding decision (from the /me response) is made before the app is revealed.
const splashDelayDone = ref(false)
const authSettled = ref(false)
const showSplash = computed(() => !splashDelayDone.value || !authSettled.value)

onMounted(() => {
  // Returns the same in-flight promise started by useAuthBootstrap.
  void auth.bootstrapTelegramAuth().finally(() => {
    authSettled.value = true
  })

  setTimeout(() => {
    splashDelayDone.value = true
  }, 1500)

  // Honour `t.me/<bot>/<app>?startapp=order_123` deep links by routing the agent
  // straight to the relevant order detail page.
  const orderId = parseOrderStartParam(readTelegramStartParam())
  if (orderId !== null) {
    void router.replace(`/orders/${orderId}`)
  }
})
</script>

<template>
  <Toaster />
  <SplashScreen v-if="showSplash" />
  <OnboardingFlow v-else-if="onboarding.needsOnboarding" />
  <RouterView v-else />
</template>
