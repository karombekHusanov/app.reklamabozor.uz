<script setup lang="ts">
import { ArrowRight, Brush, Megaphone, ShieldCheck } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { Button } from '@/core/ui/button'
import TopAgenciesSlider from '@/modules/home/components/TopAgenciesSlider.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { fullName, isBusinessUser } from '@/modules/auth/types/user'
import { ROUTES } from '@/modules/shell/constants/routes'

const auth = useAuthStore()
const router = useRouter()
const { user: telegramUser } = useTelegram()

const displayName = computed(() => {
  if (auth.user) return fullName(auth.user) || 'Reklama Bozor'
  if (telegramUser.value?.first_name) return telegramUser.value.first_name
  return 'Reklama Bozor'
})

const isAgent = computed(() => (auth.user ? isBusinessUser(auth.user) : false))

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

function placeOrder(type: 'agent' | 'designer') {
  router.push({ path: ROUTES.newOrder, query: { type } })
}
</script>

<template>
  <div>
    <AppHeader
      :subtitle="greeting"
      :title="displayName"
      :show-avatar="auth.isAuthenticated"
      :user-name="displayName"
    />

    <section class="space-y-5 px-5">
      <!-- Advertising CTA -->
      <GlassCard class="relative overflow-hidden">
        <div class="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 via-primary/10 to-violet-500/20" />
        <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Megaphone class="size-6" />
        </div>
        <h2 class="mt-3 text-lg font-semibold">
          Want to advertise?
        </h2>
        <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
          Leave a request and verified agencies will reach out to you with their offers — no searching required.
        </p>
        <Button class="mt-4 h-11 w-full rounded-2xl" @click="placeOrder('agent')">
          Place a request
          <ArrowRight class="size-4" />
        </Button>
      </GlassCard>

      <!-- Designer CTA -->
      <GlassCard class="relative overflow-hidden">
        <div class="absolute inset-0 -z-10 bg-gradient-to-br from-amber-400/20 via-orange-400/10 to-amber-500/20" />
        <div class="flex size-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Brush class="size-6" />
        </div>
        <h2 class="mt-3 text-lg font-semibold">
          Need a designer?
        </h2>
        <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
          Choose the service you need and our specialists will contact you with proposals.
        </p>
        <Button variant="outline" class="mt-4 h-11 w-full rounded-2xl" @click="placeOrder('designer')">
          Find a designer
          <ArrowRight class="size-4" />
        </Button>
      </GlassCard>

      <!-- Top agencies slider -->
      <TopAgenciesSlider />

      <!-- Become an agent -->
      <GlassCard
        v-if="!isAgent"
        interactive
        class="flex items-center gap-4"
        @click="router.push(ROUTES.agentHub)"
      >
        <div class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck class="size-6" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold">
            Become an advertising agent
          </p>
          <p class="text-sm text-muted-foreground">
            Offer your services and receive client orders.
          </p>
        </div>
        <ArrowRight class="size-5 shrink-0 text-muted-foreground" />
      </GlassCard>
    </section>
  </div>
</template>
