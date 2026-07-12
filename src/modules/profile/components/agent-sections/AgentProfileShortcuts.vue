<script setup lang="ts">
import { ChevronRight, CircleX, ClipboardList, Clock, Inbox, Plus, Settings, ShieldCheck, UserRound } from '@lucide/vue'
import { computed } from 'vue'
import { ROUTES } from '@/modules/shell/constants/routes'

export type AgentVerificationState = 'none' | 'pending' | 'rejected'

const props = defineProps<{
  locale: any
  /** Agent KYC not approved yet — show the verification entry in the menu. */
  needsVerification?: boolean
  verificationState?: AgentVerificationState
  rejectionReason?: string | null
}>()

const emit = defineEmits<{
  navigate: [to: string]
}>()

const verifyMeta = computed(() => {
  if (props.verificationState === 'pending') {
    return {
      icon: Clock,
      badge: props.locale.t.profile.agentShortcutVerifyStatusLabel,
      title: props.locale.t.agent.statusPending,
      hint: props.locale.t.agent.statusPendingMsg,
      tone: 'agent-verify-cta--pending',
      pulse: false,
    }
  }

  if (props.verificationState === 'rejected') {
    return {
      icon: CircleX,
      badge: props.locale.t.profile.agentShortcutVerifyStatusLabel,
      title: props.locale.t.agent.statusRejected,
      hint: props.rejectionReason?.trim() || props.locale.t.agent.statusRejectedMsg,
      tone: 'agent-verify-cta--rejected',
      pulse: false,
    }
  }

  return {
    icon: ShieldCheck,
    badge: props.locale.t.profile.agentShortcutVerifyBadge,
    title: props.locale.t.profile.agentShortcutVerify,
    hint: props.locale.t.profile.agentShortcutVerifyHint,
    tone: '',
    pulse: true,
  }
})

function openVerification() {
  emit('navigate', ROUTES.profileEdit)
}
</script>

<template>
  <div class="agent-profile-section">
    <button
      v-if="needsVerification"
      type="button"
      class="agent-verify-cta pressable"
      :class="verifyMeta.tone"
      @click="openVerification"
    >
      <span class="agent-verify-cta__icon">
        <span
          v-if="verifyMeta.pulse"
          class="agent-verify-cta__icon-pulse"
          aria-hidden="true"
        />
        <component
          :is="verifyMeta.icon"
          class="relative size-5"
        />
      </span>

      <span class="agent-verify-cta__copy">
        <span class="agent-verify-cta__badge">
          {{ verifyMeta.badge }}
        </span>
        <span class="agent-verify-cta__title">
          {{ verifyMeta.title }}
        </span>
        <span class="agent-verify-cta__hint">
          {{ verifyMeta.hint }}
        </span>
      </span>

      <ChevronRight
        class="agent-verify-cta__chevron"
        aria-hidden="true"
      />
    </button>

    <div class="divide-y divide-border/70">
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
  </div>
</template>
