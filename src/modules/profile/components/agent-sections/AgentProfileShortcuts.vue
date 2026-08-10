<script setup lang="ts">
import { ChevronRight, ClipboardList, Inbox, LogOut, Settings, UserRound, Wallet } from '@lucide/vue'
import WebApp from '@twa-dev/sdk'
import { ROUTES } from '@/modules/shell/constants/routes'
import { earningsStrings } from '@/modules/profile/lib/earnings-i18n'
import { isInsideTelegram, supportsVersion } from '@/core/lib/telegram-init'

const props = defineProps<{
  locale: any
}>()

const emit = defineEmits<{
  navigate: [to: string]
  logout: []
}>()

function confirmSignOut() {
  const message = props.locale.t.profile.signOutConfirm
  try {
    if (isInsideTelegram() && supportsVersion('6.2') && typeof WebApp.showConfirm === 'function') {
      WebApp.showConfirm(message, (confirmed) => {
        if (confirmed) emit('logout')
      })
      return
    }
  }
  catch {
    // fall through
  }
  if (window.confirm(message)) emit('logout')
}
</script>

<template>
  <div class="space-y-3">
    <div>
      <h2 class="profile-settings-section-title">
        {{ locale.t.profile.accountSectionActivity }}
      </h2>
      <div class="app-list">
        <button
          type="button"
          class="app-list-row pressable"
          @click="emit('navigate', ROUTES.offers)"
        >
          <span class="app-list-row__icon app-list-row__icon--indigo">
            <Inbox class="size-4" />
          </span>
          <span class="app-list-row__body">
            <span class="app-list-row__label">
              {{ locale.t.profile.agentShortcutOffers }}
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
          @click="emit('navigate', ROUTES.earnings)"
        >
          <span class="app-list-row__icon app-list-row__icon--emerald">
            <Wallet class="size-4" />
          </span>
          <span class="app-list-row__body">
            <span class="app-list-row__label">
              {{ earningsStrings(locale.locale).title }}
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
          @click="emit('navigate', ROUTES.orders)"
        >
          <span class="app-list-row__icon app-list-row__icon--sky">
            <ClipboardList class="size-4" />
          </span>
          <span class="app-list-row__body">
            <span class="app-list-row__label">
              {{ locale.t.profile.agentShortcutOrders }}
            </span>
          </span>
          <ChevronRight
            class="app-list-row__chevron"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <div>
      <h2 class="profile-settings-section-title">
        {{ locale.t.profile.accountSectionAccount }}
      </h2>
      <div class="app-list">
        <button
          type="button"
          class="app-list-row pressable"
          @click="emit('navigate', ROUTES.profileEdit)"
        >
          <span class="app-list-row__icon app-list-row__icon--teal">
            <UserRound class="size-4" />
          </span>
          <span class="app-list-row__body">
            <span class="app-list-row__label">
              {{ locale.t.profile.agentShortcutEditProfile }}
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
