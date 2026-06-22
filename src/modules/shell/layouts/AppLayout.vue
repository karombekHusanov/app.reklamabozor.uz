<script setup lang="ts">
import TabBar from '@/modules/shell/components/TabBar.vue'
import PhoneGate from '@/modules/auth/components/PhoneGate.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

const auth = useAuthStore()
</script>

<template>
  <!-- Authenticated users must share their phone before reaching the app. -->
  <PhoneGate v-if="auth.needsPhone" />

  <div v-else class="tahoe-bg flex min-h-svh flex-col">
    <main class="mx-auto flex w-full max-w-lg flex-1 flex-col pb-28">
      <RouterView />
    </main>
    <TabBar />
  </div>
</template>
