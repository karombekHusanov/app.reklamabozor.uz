<script setup lang="ts">
import { ROUTES } from '@/modules/shell/constants/routes'
import { useTelegram } from '@/core/composables/useTelegram'
import { cn } from '@/core/lib/utils'
import { Brush, ClipboardList, Home, Megaphone, UserRound } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { haptic } = useTelegram()

const tabs = [
  { to: ROUTES.home, label: 'Home', icon: Home },
  { to: ROUTES.marketplace, label: 'Agents', icon: Megaphone },
  { to: ROUTES.designers, label: 'Designers', icon: Brush },
  { to: ROUTES.orders, label: 'Orders', icon: ClipboardList },
  { to: ROUTES.profile, label: 'Profile', icon: UserRound },
]

const activePath = computed(() => route.path)

function navigate(to: string) {
  if (activePath.value === to) return
  haptic('light')
  router.push(to)
}
</script>

<template>
  <nav class="tab-bar safe-bottom">
    <div class="mx-auto flex max-w-lg items-center justify-between gap-0.5 px-2 py-2">
      <button
        v-for="tab in tabs"
        :key="tab.to"
        type="button"
        class="flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 transition-colors"
        :class="cn(
          activePath === tab.to
            ? 'bg-white/70 text-primary shadow-sm dark:bg-white/10'
            : 'text-muted-foreground',
        )"
        @click="navigate(tab.to)"
      >
        <component :is="tab.icon" class="size-5" />
        <span class="text-[10px] font-medium">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>
