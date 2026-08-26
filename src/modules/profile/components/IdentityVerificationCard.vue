<script setup lang="ts">
import { BadgeCheck, Loader2, ShieldCheck, XCircle } from '@lucide/vue'
import { computed, onBeforeUnmount, ref } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { getApiErrorMessage } from '@/core/api/api-error'
import { openExternalLink } from '@/core/lib/telegram-init'
import { authorizeIdentity, simulateIdentity } from '@/modules/profile/services/identity.service'

const auth = useAuthStore()
const locale = useLocaleStore()

const status = computed(() => auth.user?.identity_status ?? null)
const verified = computed(() => auth.user?.identity_verified === true)

// Show whenever MyID is configured, or when the user already has any state
// (so verified/failed still render even if the flag is later toggled off).
// Never for admins.
const applies = computed(() =>
  auth.user?.role !== 'admin'
  && (auth.user?.identity_verification_enabled === true || status.value !== null),
)

const starting = ref(false)
const waiting = ref(false)
const error = ref<string | null>(null)

let pollTimer: ReturnType<typeof setInterval> | null = null
let stopAt = 0

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  waiting.value = false
  document.removeEventListener('visibilitychange', onVisible)
}

async function poll() {
  await auth.refreshUser()
  // Resolved (verified or failed) or timed out → stop waiting.
  if (verified.value || status.value === 'failed' || Date.now() > stopAt) {
    stopPolling()
  }
}

function onVisible() {
  // User bounced back into Telegram — check immediately.
  if (document.visibilityState === 'visible') void poll()
}

function startPolling() {
  waiting.value = true
  stopAt = Date.now() + 150_000 // ~2.5 min budget
  pollTimer = setInterval(() => void poll(), 4000)
  document.addEventListener('visibilitychange', onVisible)
}

async function verify() {
  if (starting.value) return
  error.value = null
  starting.value = true
  try {
    // Dev/test simulate mode: grant the badge directly, no external MyID window.
    if (auth.user?.identity_simulate) {
      await simulateIdentity()
      await auth.refreshUser()
      return
    }
    const url = await authorizeIdentity()
    openExternalLink(url)
    startPolling()
  }
  catch (e) {
    error.value = getApiErrorMessage(e)
  }
  finally {
    starting.value = false
  }
}

onBeforeUnmount(stopPolling)
</script>

<template>
  <GlassCard
    v-if="applies"
    class="space-y-3 p-4"
  >
    <div class="flex items-center gap-2">
      <span
        class="flex size-8 items-center justify-center rounded-full"
        :class="verified ? 'bg-emerald-500/15 text-emerald-500' : 'bg-primary/10 text-primary'"
      >
        <BadgeCheck
          v-if="verified"
          class="size-4"
        />
        <Loader2
          v-else-if="waiting || status === 'pending'"
          class="size-4 animate-spin"
        />
        <XCircle
          v-else-if="status === 'failed'"
          class="size-4 text-destructive"
        />
        <ShieldCheck
          v-else
          class="size-4"
        />
      </span>
      <h3 class="text-sm font-semibold text-foreground">
        {{ locale.t.identityVerify.title }}
      </h3>
    </div>

    <!-- Verified -->
    <p
      v-if="verified"
      class="text-[13px] text-emerald-600 dark:text-emerald-400"
    >
      {{ locale.t.identityVerify.verified }}
    </p>

    <!-- Waiting for the external MyID window / callback -->
    <p
      v-else-if="waiting || status === 'pending'"
      class="text-[13px] text-muted-foreground"
    >
      {{ locale.t.identityVerify.waiting }}
    </p>

    <!-- CTA (fresh) or retry (after a failed attempt) -->
    <template v-else>
      <p class="text-[12px] leading-snug text-muted-foreground">
        {{ status === 'failed' ? locale.t.identityVerify.failed : locale.t.identityVerify.desc }}
      </p>

      <p
        v-if="error"
        class="text-[12px] text-destructive"
      >
        {{ error }}
      </p>

      <Button
        class="w-full"
        :disabled="starting"
        @click="verify"
      >
        {{ starting
          ? locale.t.identityVerify.starting
          : (status === 'failed' ? locale.t.identityVerify.retry : locale.t.identityVerify.verify) }}
      </Button>
    </template>
  </GlassCard>
</template>
