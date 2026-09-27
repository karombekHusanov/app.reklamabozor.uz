<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAuthBootstrap } from '@/modules/auth'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useRealtimeStore } from '@/core/stores/realtime.store'
import Toaster from '@/core/ui/Toaster.vue'
import ConfirmDrawer from '@/core/ui/ConfirmDrawer.vue'
import PropuskDrawer from '@/modules/agent/components/PropuskDrawer.vue'
import { parseOrderStartParam, readTelegramStartParam } from '@/core/lib/telegram-init'
import { SplashScreen, OnboardingFlow, TermsGate, useOnboardingStore } from '@/modules/onboarding'

useAuthBootstrap()

const router = useRouter()
const auth = useAuthStore()
const onboarding = useOnboardingStore()
const realtime = useRealtimeStore()

// One socket per signed-in session — being connected is what "online" means.
watch(
  () => auth.isAuthenticated,
  (signedIn) => {
    if (signedIn) void realtime.start()
    else realtime.stop()
  },
  { immediate: true },
)

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
  <PropuskDrawer />
  <ConfirmDrawer />
  <SplashScreen v-if="showSplash" />
  <OnboardingFlow v-else-if="onboarding.needsOnboarding" />
  <!-- Returning user whose accepted offer version is outdated must re-accept. -->
  <TermsGate v-else-if="auth.needsTerms" />
  <RouterView v-else />
</template>
