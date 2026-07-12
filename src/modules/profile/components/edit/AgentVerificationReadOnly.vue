<script setup lang="ts">
import { FileText, Lock } from '@lucide/vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { AgentProfile } from '@/modules/agent/types/agent'

defineProps<{
  profile: AgentProfile
}>()

const locale = useLocaleStore()

function display(value: string | null | undefined): string {
  return value?.trim() ? value.trim() : '—'
}
</script>

<template>
  <div class="space-y-4">
    <div class="profile-edit-lock-banner">
      <Lock class="size-4 shrink-0" />
      <p class="text-xs leading-relaxed">
        {{ locale.t.agent.verificationReadOnlyNotice }}
      </p>
    </div>

    <GlassCard class="space-y-4">
      <p class="text-sm font-semibold text-foreground">
        {{ locale.t.agent.company }}
      </p>

      <div class="profile-edit-readonly-field">
        <p class="profile-edit-readonly-field__label">{{ locale.t.agent.companyName }}</p>
        <p class="profile-edit-readonly-field__value">{{ display(profile.company_name) }}</p>
      </div>

      <div class="profile-edit-readonly-field">
        <p class="profile-edit-readonly-field__label">{{ locale.t.agent.legalForm }}</p>
        <p class="profile-edit-readonly-field__value">{{ display(profile.legal_form) }}</p>
      </div>

      <div class="profile-edit-readonly-field">
        <p class="profile-edit-readonly-field__label">{{ locale.t.agent.innLabel }}</p>
        <p class="profile-edit-readonly-field__value">{{ display(profile.inn) }}</p>
      </div>
    </GlassCard>

    <GlassCard class="space-y-4">
      <p class="text-sm font-semibold text-foreground">
        {{ locale.t.agent.director }}
      </p>

      <div class="profile-edit-readonly-field">
        <p class="profile-edit-readonly-field__label">{{ locale.t.agent.fullName }}</p>
        <p class="profile-edit-readonly-field__value">{{ display(profile.director_name) }}</p>
      </div>

      <div class="profile-edit-readonly-field">
        <p class="profile-edit-readonly-field__label">{{ locale.t.agent.passport }}</p>
        <p class="profile-edit-readonly-field__value">{{ display(profile.director_passport) }}</p>
      </div>

      <a
        v-if="profile.director_passport_file"
        :href="profile.director_passport_file"
        target="_blank"
        rel="noopener"
        class="profile-edit-readonly-file"
      >
        <FileText class="size-4 shrink-0" />
        <span class="truncate">{{ locale.t.agent.passportScan }}</span>
      </a>
    </GlassCard>

    <GlassCard class="space-y-4">
      <p class="text-sm font-semibold text-foreground">
        {{ locale.t.agent.registrationBank }}
      </p>

      <a
        v-if="profile.registration_certificate_file"
        :href="profile.registration_certificate_file"
        target="_blank"
        rel="noopener"
        class="profile-edit-readonly-file"
      >
        <FileText class="size-4 shrink-0" />
        <span class="truncate">{{ locale.t.agent.registrationCert }}</span>
      </a>

      <div class="profile-edit-readonly-field">
        <p class="profile-edit-readonly-field__label">{{ locale.t.agent.bankName }}</p>
        <p class="profile-edit-readonly-field__value">{{ display(profile.bank_name) }}</p>
      </div>

      <div class="profile-edit-readonly-field">
        <p class="profile-edit-readonly-field__label">{{ locale.t.agent.accountNumber }}</p>
        <p class="profile-edit-readonly-field__value">{{ display(profile.bank_account) }}</p>
      </div>

      <div class="profile-edit-readonly-field">
        <p class="profile-edit-readonly-field__label">{{ locale.t.agent.mfo }}</p>
        <p class="profile-edit-readonly-field__value">{{ display(profile.mfo) }}</p>
      </div>

      <div class="profile-edit-readonly-field">
        <p class="profile-edit-readonly-field__label">{{ locale.t.agent.contactPhone }}</p>
        <p class="profile-edit-readonly-field__value">{{ display(profile.phone) }}</p>
      </div>
    </GlassCard>
  </div>
</template>
