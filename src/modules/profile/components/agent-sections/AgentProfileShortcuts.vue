<script setup lang="ts">
import { ChevronRight, ClipboardList, Inbox, Plus, Settings, UserRound } from '@lucide/vue'
import { ROUTES } from '@/modules/shell/constants/routes'

defineProps<{
  locale: any
}>()

const emit = defineEmits<{
  navigate: [to: string]
}>()
</script>

<template>
  <div class="agent-profile-section divide-y divide-border/70">
    <button
      type="button"
      class="client-profile-shortcut pressable"
      @click="emit('navigate', ROUTES.orders)"
    >
      <span class="client-profile-shortcut__icon client-profile-shortcut__icon--sky">
        <ClipboardList class="size-4" />
      </span>
      <span class="client-profile-shortcut__label">
        {{ locale.t.profile.agentShortcutOrders }}
      </span>
      <ChevronRight class="client-profile-shortcut__chevron" aria-hidden="true" />
    </button>

    <button
      type="button"
      class="client-profile-shortcut pressable"
      @click="emit('navigate', ROUTES.offers)"
    >
      <span class="client-profile-shortcut__icon client-profile-shortcut__icon--indigo">
        <Inbox class="size-4" />
      </span>
      <span class="client-profile-shortcut__label">
        {{ locale.t.profile.agentShortcutOffers }}
      </span>
      <ChevronRight class="client-profile-shortcut__chevron" aria-hidden="true" />
    </button>

    <button
      type="button"
      class="client-profile-shortcut pressable"
      @click="emit('navigate', ROUTES.settings)"
    >
      <span class="client-profile-shortcut__icon client-profile-shortcut__icon--violet">
        <Settings class="size-4" />
      </span>
      <span class="client-profile-shortcut__label">
        {{ locale.t.profile.agentShortcutSettings }}
      </span>
      <ChevronRight class="client-profile-shortcut__chevron" aria-hidden="true" />
    </button>

    <button
      type="button"
      class="client-profile-shortcut pressable"
      @click="emit('navigate', ROUTES.profileEdit)"
    >
      <span class="client-profile-shortcut__icon client-profile-shortcut__icon--teal">
        <UserRound class="size-4" />
      </span>
      <span class="client-profile-shortcut__label">
        {{ locale.t.profile.agentShortcutEditProfile }}
      </span>
      <ChevronRight class="client-profile-shortcut__chevron" aria-hidden="true" />
    </button>

    <button
      type="button"
      class="client-profile-shortcut pressable"
      @click="emit('navigate', ROUTES.newOrder)"
    >
      <span class="client-profile-shortcut__icon client-profile-shortcut__icon--amber">
        <Plus class="size-4" />
      </span>
      <span class="client-profile-shortcut__label">
        {{ locale.t.profile.agentShortcutNewOrder }}
      </span>
      <ChevronRight class="client-profile-shortcut__chevron" aria-hidden="true" />
    </button>
  </div>
</template>
