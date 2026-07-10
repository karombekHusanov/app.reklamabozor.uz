<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabBar from '@/modules/shell/components/TabBar.vue'
import PhoneGate from '@/modules/auth/components/PhoneGate.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ROUTES } from '@/modules/shell/constants/routes'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

// Some pages (e.g. the order wizard) provide their own bottom action bar and
// hide the global tab bar via `meta.hideTabBar`.
const hideTabBar = computed(() => route.meta.hideTabBar === true)

// Native-feel navigation: deeper routes push in from the right, going back pops
// out, and switching between tab roots cross-fades.
const TAB_ROOTS = new Set<string>([ROUTES.home, ROUTES.products, ROUTES.chat, ROUTES.orders])

function depthOf(path: string): number {
  // Tab roots share depth 1 so "/" vs "/orders" is a tab switch, not a push.
  if (TAB_ROOTS.has(path)) return 1
  return path.split('/').filter(Boolean).length + 1
}

const transitionName = ref('page-fade')

router.afterEach((to, from) => {
  if (TAB_ROOTS.has(to.path) && TAB_ROOTS.has(from.path)) {
    transitionName.value = 'page-fade'
    return
  }

  const delta = depthOf(to.path) - depthOf(from.path)
  transitionName.value = delta > 0 ? 'page-push' : delta < 0 ? 'page-pop' : 'page-fade'
})
</script>

<template>
  <!-- Authenticated users must share their phone before reaching the app. -->
  <PhoneGate v-if="auth.needsPhone" />

  <div
    v-else
    class="flex min-h-svh flex-col bg-background"
  >
    <main
      class="mx-auto flex w-full max-w-lg flex-1 flex-col"
      :class="hideTabBar ? 'pb-6' : 'pb-28'"
    >
      <RouterView v-slot="{ Component }">
        <Transition
          :name="transitionName"
          mode="out-in"
        >
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <TabBar v-if="!hideTabBar" />
  </div>
</template>
