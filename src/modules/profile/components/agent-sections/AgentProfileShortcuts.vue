<script setup lang="ts">
import { ChevronRight, LogOut, Settings } from '@lucide/vue'
import { ROUTES } from '@/modules/shell/constants/routes'
import { confirmAction } from '@/core/lib/confirm-action'
import type { useLocaleStore } from '@/core/i18n/locale.store'

const props = defineProps<{
  locale: ReturnType<typeof useLocaleStore>
}>()

const emit = defineEmits<{
  navigate: [to: string]
  logout: []
}>()

async function confirmSignOut() {
  const ok = await confirmAction({
    message: props.locale.t.profile.signOutConfirm,
    confirmLabel: props.locale.t.profile.signOut,
    tone: 'danger',
    icon: LogOut,
  })
  if (ok) emit('logout')
}
</script>

<template>
  <div class="space-y-3">
    <div>
      <h2 class="profile-settings-section-title">
        {{ locale.t.profile.accountSectionAccount }}
      </h2>
      <div class="app-list">
        <button
          type="button"
          class="app-list-row pressable"
          @click="emit('navigate', ROUTES.settings)"
        >
          <span class="app-list-row__icon app-list-row__icon--violet">
            <Settings class="size-4" />
          </span>
          <span class="app-list-row__body">
            <span class="app-list-row__label">
              {{ locale.t.profile.agentShortcutSettings }}
            </span>
          </span>
          <ChevronRight
            class="app-list-row__chevron"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          class="app-list-row pressable"
          @click="confirmSignOut"
        >
          <span class="app-list-row__icon !border-red-500/20 !bg-red-500/8 !text-red-600">
            <LogOut class="size-4" />
          </span>
          <span class="app-list-row__body">
            <span class="app-list-row__label text-red-600 dark:text-red-400">
              {{ locale.t.profile.signOut }}
            </span>
          </span>
          <ChevronRight
            class="app-list-row__chevron"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  </div>
</template>
