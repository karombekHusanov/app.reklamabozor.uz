<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAuthBootstrap } from '@/modules/auth'
import { parseOrderStartParam, readTelegramStartParam } from '@/core/lib/telegram-init'
import { ROUTES } from '@/modules/shell/constants/routes'

useAuthBootstrap()

const router = useRouter()

// Honour `t.me/<bot>/<app>?startapp=order_123` deep links by routing the agent
// straight to the relevant order. (Bot inline buttons already open /agent?order=…)
onMounted(() => {
  const orderId = parseOrderStartParam(readTelegramStartParam())
  if (orderId !== null) {
    void router.replace({ path: ROUTES.agentHub, query: { order: String(orderId) } })
  }
})
</script>

<template>
  <RouterView />
</template>
