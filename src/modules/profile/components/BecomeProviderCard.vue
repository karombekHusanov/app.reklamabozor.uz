<script setup lang="ts">
import { Building2, User } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { isBusinessUser } from '@/modules/auth/types/user'

// Entry to becoming an executor ("ijrochi") — one agent role on one of two legal
// tracks: individual (light KYC, Tezkor) or legal entity (full KYC, Tender).
// Both are admin-approved. Hidden once the user already runs a provider profile.
const auth = useAuthStore()
const locale = useLocaleStore()
const router = useRouter()
const { haptic } = useTelegram()

const show = computed(() => auth.user != null && !isBusinessUser(auth.user))

function go(track: 'individual' | 'legal') {
  haptic('light')
  void router.push({ path: '/profile/edit', query: { as: 'agent', track } })
}
</script>

<template>
  <GlassCard
    v-if="show"
    class="space-y-3 p-4"
  >
    <h3 class="text-sm font-semibold text-foreground">
      {{ locale.t.profile.becomeProviderTitle }}
    </h3>
    <p class="text-[12px] leading-snug text-muted-foreground">
      {{ locale.t.profile.becomeProviderHint }}
    </p>

    <div class="grid grid-cols-2 gap-2">
      <button
        type="button"
        class="glass-chip flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3 text-[13px] font-semibold"
        @click="go('individual')"
      >
        <User class="size-4 text-primary" />
        {{ locale.t.executor.trackIndividual }}
      </button>
      <button
        type="button"
        class="glass-chip flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3 text-[13px] font-semibold"
        @click="go('legal')"
      >
        <Building2 class="size-4 text-primary" />
        {{ locale.t.executor.trackLegal }}
      </button>
    </div>
  </GlassCard>
</template>
