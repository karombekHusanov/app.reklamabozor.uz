<script setup lang="ts">
import { Loader2, Phone, ShieldCheck } from '@lucide/vue'
import { computed, ref } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { requestTelegramContact } from '@/core/lib/telegram-init'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

type GateState = 'idle' | 'sharing' | 'verifying' | 'declined' | 'timeout'

const auth = useAuthStore()
const { haptic } = useTelegram()

const state = ref<GateState>('idle')

const busy = computed(() => state.value === 'sharing' || state.value === 'verifying')

const firstName = computed(() => auth.user?.first_name ?? '')

async function pollForPhone(maxMs = 12000): Promise<boolean> {
  const deadline = Date.now() + maxMs

  while (Date.now() < deadline) {
    const user = await auth.refreshUser()

    // Once the webhook stores the phone, `auth.needsPhone` flips false and the
    // gate unmounts automatically — no explicit success state required.
    if (user?.phone) {
      return true
    }

    await new Promise((resolve) => setTimeout(resolve, 1200))
  }

  return false
}

async function share() {
  haptic('light')
  state.value = 'sharing'

  const granted = await requestTelegramContact()

  if (!granted) {
    state.value = 'declined'
    return
  }

  haptic('medium')
  state.value = 'verifying'

  const ok = await pollForPhone()

  if (!ok) {
    state.value = 'timeout'
  }
}

async function retryVerify() {
  state.value = 'verifying'
  const ok = await pollForPhone(6000)
  if (!ok) state.value = 'timeout'
}
</script>

<template>
  <div class="tahoe-bg flex min-h-svh flex-col items-center justify-center px-6">
    <GlassCard class="w-full max-w-sm space-y-5 text-center">
      <div class="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <Phone class="size-7" />
      </div>

      <div class="space-y-2">
        <h1 class="text-xl font-semibold">
          {{ firstName ? `${firstName}, telefon raqamingiz kerak` : 'Telefon raqamingiz kerak' }}
        </h1>
        <p class="text-sm leading-relaxed text-muted-foreground">
          AdSpace'dan foydalanish uchun telefon raqamingizni Telegram orqali ulashing.
          Bu bir martalik va xavfsiz.
        </p>
      </div>

      <div class="flex items-start gap-3 rounded-2xl bg-white/40 p-4 text-left dark:bg-white/5">
        <ShieldCheck class="mt-0.5 size-5 shrink-0 text-primary" />
        <p class="text-xs text-muted-foreground">
          Raqamingiz faqat hisobingizni tasdiqlash uchun ishlatiladi va boshqalarga ko'rsatilmaydi.
        </p>
      </div>

      <Button
        class="h-12 w-full rounded-2xl text-base"
        :disabled="busy"
        @click="share"
      >
        <Loader2 v-if="busy" class="size-4 animate-spin" />
        <Phone v-else class="size-4" />
        <template v-if="state === 'sharing'">
          Telegram oynasi ochilmoqda…
        </template>
        <template v-else-if="state === 'verifying'">
          Tasdiqlanmoqda…
        </template>
        <template v-else>
          Telefon raqamni ulashish
        </template>
      </Button>

      <p
        v-if="state === 'declined'"
        class="text-xs text-amber-600 dark:text-amber-400"
      >
        Raqam ulashilmadi. Davom etish uchun yuqoridagi tugmani bosing va "Ulashish"ni tanlang.
      </p>

      <div v-else-if="state === 'timeout'" class="space-y-2">
        <p class="text-xs text-muted-foreground">
          Raqam hali tasdiqlanmadi. Bir lahzadan so'ng qayta urinib ko'ring.
        </p>
        <Button variant="outline" class="h-10 w-full rounded-2xl" @click="retryVerify">
          Qayta tekshirish
        </Button>
      </div>
    </GlassCard>
  </div>
</template>
