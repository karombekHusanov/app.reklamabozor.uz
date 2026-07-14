<script setup lang="ts">
import { Briefcase, Check, ChevronRight, Loader2, Palette, Plus, Store, UserRound } from '@lucide/vue'
import { computed, ref, type Component } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { SELF_SELECTABLE_ROLES, type SelectableRole } from '@/modules/auth/types/user'

const auth = useAuthStore()
const locale = useLocaleStore()
const { haptic } = useTelegram()

const switching = ref<SelectableRole | null>(null)
const errorMessage = ref<string | null>(null)

const ROLE_ICONS: Record<SelectableRole, Component> = {
  client: UserRound,
  agent: Briefcase,
  designer: Palette,
  seller: Store,
}

interface RoleOption {
  role: SelectableRole
  active: boolean
  held: boolean
}

const options = computed<RoleOption[]>(() => {
  const user = auth.user
  if (!user) return []

  const held = user.roles ?? [user.role]

  return SELF_SELECTABLE_ROLES.map(role => ({
    role,
    active: user.role === role,
    held: held.includes(role),
  }))
})

function hintFor(option: RoleOption): string {
  if (switching.value === option.role) return locale.t.profile.roleSwitching
  if (option.active) return locale.t.profile.roleActiveBadge
  if (option.held) return locale.t.profile.roleSwitchHint
  return locale.t.profile.roleAcquireHint
}

async function pick(option: RoleOption) {
  if (switching.value || option.active) return

  switching.value = option.role
  errorMessage.value = null
  haptic('medium')

  const ok = await auth.switchRole(option.role)
  switching.value = null

  if (ok) {
    haptic('light')
  }
  else {
    errorMessage.value = auth.error || locale.t.profile.roleSwitchError
  }
}
</script>

<template>
  <div v-if="options.length">
    <h2 class="profile-settings-section-title">
      {{ locale.t.profile.roleSwitcherTitle }}
    </h2>

    <GlassCard padding="none" class="overflow-hidden">
      <div class="divide-y divide-border/70">
        <button
          v-for="option in options"
          :key="option.role"
          type="button"
          class="profile-settings-action pressable"
          :disabled="switching !== null"
          @click="pick(option)"
        >
          <span
            class="profile-settings-row__icon"
            :class="option.active ? 'profile-settings-row__icon--sky' : 'text-muted-foreground'"
          >
            <component :is="ROLE_ICONS[option.role]" class="size-3.5" />
          </span>

          <span class="min-w-0 flex-1 text-left">
            <span
              class="block text-[13px] font-semibold"
              :class="option.active ? 'text-primary' : 'text-foreground'"
            >
              {{ locale.t.roles[option.role] }}
            </span>
            <span class="block text-[11px] text-muted-foreground">
              {{ hintFor(option) }}
            </span>
          </span>

          <Loader2
            v-if="switching === option.role"
            class="size-3.5 shrink-0 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
          <Check
            v-else-if="option.active"
            class="size-3.5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <ChevronRight
            v-else-if="option.held"
            class="size-3.5 shrink-0 text-muted-foreground/50"
            aria-hidden="true"
          />
          <Plus
            v-else
            class="size-3.5 shrink-0 text-muted-foreground/50"
            aria-hidden="true"
          />
        </button>
      </div>
    </GlassCard>

    <p
      v-if="errorMessage"
      class="mt-2 rounded-2xl bg-destructive/10 px-3 py-2 text-[12px] text-destructive"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>
