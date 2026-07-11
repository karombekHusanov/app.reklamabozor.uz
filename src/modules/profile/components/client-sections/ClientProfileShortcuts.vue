<script setup lang="ts">
import { ChevronRight, ClipboardList, Plus, Settings, UserRound } from '@lucide/vue'
import { ROUTES } from '@/modules/shell/constants/routes'

defineProps<{
  locale: any
}>()

const emit = defineEmits<{
  navigate: [to: string]
}>()
</script>

<template>
  <div class="home-card divide-y divide-border/70">
    <button
      type="button"
      class="client-profile-shortcut pressable"
      @click="emit('navigate', ROUTES.newOrder)"
    >
      <span class="client-profile-shortcut__icon client-profile-shortcut__icon--amber">
        <Plus class="size-4" />
      </span>
      <span class="client-profile-shortcut__label">
        {{ locale.t.profile.clientShortcutNewOrder }}
      </span>
      <ChevronRight class="client-profile-shortcut__chevron" aria-hidden="true" />
    </button>

    <button
      type="button"
      class="client-profile-shortcut pressable"
      @click="emit('navigate', ROUTES.orders)"
    >
      <span class="client-profile-shortcut__icon client-profile-shortcut__icon--sky">
        <ClipboardList class="size-4" />
      </span>
      <span class="client-profile-shortcut__label">
        {{ locale.t.profile.clientShortcutOrders }}
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
        {{ locale.t.profile.clientShortcutEditProfile }}
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
        {{ locale.t.profile.clientShortcutSettings }}
      </span>
      <ChevronRight class="client-profile-shortcut__chevron" aria-hidden="true" />
    </button>
  </div>
</template>
