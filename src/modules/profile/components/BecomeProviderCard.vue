<script setup lang="ts">
import { Briefcase, Palette } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { isBusinessUser } from '@/modules/auth/types/user'

// Entry to becoming a provider — replaces the old role-switch flow. Submitting
// the target form grants the role (designer) or starts KYC (agent); there is no
// PATCH /me/role. Hidden once the user already runs a provider profile.
const auth = useAuthStore()
const locale = useLocaleStore()
const router = useRouter()
const { haptic } = useTelegram()

const show = computed(() => auth.user != null && !isBusinessUser(auth.user))

function go(as: 'agent' | 'designer') {
  haptic('light')
  void router.push({ path: '/profile/edit', query: { as } })
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
        @click="go('agent')"
      >
        <Briefcase class="size-4 text-primary" />
        {{ locale.t.roles.agent }}
      </button>
      <button
        type="button"
        class="glass-chip flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3 text-[13px] font-semibold"
        @click="go('designer')"
      >
        <Palette class="size-4 text-primary" />
        {{ locale.t.roles.designer }}
      </button>
    </div>
  </GlassCard>
</template>
