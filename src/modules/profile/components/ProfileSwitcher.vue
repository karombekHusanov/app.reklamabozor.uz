<script setup lang="ts">
import { Briefcase, Loader2, Palette, Store, UserRound } from '@lucide/vue'
import { computed, ref, type Component } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { SELF_SELECTABLE_ROLES, type SelectableRole } from '@/modules/auth/types/user'

// Compact quick-switch between the profiles (roles) the user already holds.
// Acquiring a new role stays in the fuller RoleSwitcher in profile settings.
const auth = useAuthStore()
const locale = useLocaleStore()
const { haptic } = useTelegram()

const switching = ref<SelectableRole | null>(null)

const ROLE_ICONS: Record<SelectableRole, Component> = {
  client: UserRound,
  agent: Briefcase,
  designer: Palette,
  seller: Store,
}

const heldRoles = computed<SelectableRole[]>(() => {
  const user = auth.user
  if (!user) return []

  const held = user.roles?.length ? user.roles : [user.role]

  return SELF_SELECTABLE_ROLES.filter(role => held.includes(role))
})

async function pick(role: SelectableRole) {
  if (switching.value || role === auth.user?.role) return

  switching.value = role
  haptic('medium')

  const ok = await auth.switchRole(role)
  switching.value = null

  if (ok) haptic('light')
}
</script>

<template>
  <div
    v-if="heldRoles.length > 1"
    class="glass-segment flex gap-1 rounded-2xl p-1"
  >
    <button
      v-for="role in heldRoles"
      :key="role"
      type="button"
      class="pressable flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold transition-colors"
      :class="auth.user?.role === role
        ? 'bg-card text-primary shadow-sm dark:bg-white/15'
        : 'text-muted-foreground'"
      :disabled="switching !== null"
      @click="pick(role)"
    >
      <Loader2
        v-if="switching === role"
        class="size-3.5 animate-spin"
        aria-hidden="true"
      />
      <component
        :is="ROLE_ICONS[role]"
        v-else
        class="size-3.5"
        aria-hidden="true"
      />
      {{ locale.t.roles[role] }}
    </button>
  </div>
</template>
