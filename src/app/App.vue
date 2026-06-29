<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAuthBootstrap } from '@/modules/auth'
import { parseOrderStartParam, readTelegramStartParam } from '@/core/lib/telegram-init'
import { ROUTES } from '@/modules/shell/constants/routes'
import { SplashScreen, OnboardingFlow, useOnboardingStore } from '@/modules/onboarding'

useAuthBootstrap()

const router = useRouter()
const onboarding = useOnboardingStore()

// Brief launch splash while Telegram auth + durable prefs hydrate in the background.
const showSplash = ref(true)

onMounted(() => {
  void onboarding.hydrate()

  setTimeout(() => {
    showSplash.value = false
  }, 1500)

  // Honour `t.me/<bot>/<app>?startapp=order_123` deep links by routing the agent
  // straight to the relevant order. (Bot inline buttons already open /agent?order=…)
  const orderId = parseOrderStartParam(readTelegramStartParam())
  if (orderId !== null) {
    void router.replace({ path: ROUTES.agentHub, query: { order: String(orderId) } })
  }
})
</script>

<template>
  <SplashScreen v-if="showSplash" />
  <OnboardingFlow v-else-if="onboarding.needsOnboarding" />
  <RouterView v-else />
</template>
