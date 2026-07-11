<script setup lang="ts">
import { computed } from 'vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import ProfileGuestCard from '@/modules/profile/components/ProfileGuestCard.vue'
import AgentProfileEditForm from '@/modules/profile/components/edit/AgentProfileEditForm.vue'
import ClientProfileEditForm from '@/modules/profile/components/edit/ClientProfileEditForm.vue'
import DesignerProfileEditForm from '@/modules/profile/components/edit/DesignerProfileEditForm.vue'

const auth = useAuthStore()
const locale = useLocaleStore()

const editSubtitle = computed(() => {
  const role = auth.user?.role
  if (role === 'agent' || role === 'seller') return locale.t.profile.editSubtitleAgent
  if (role === 'designer') return locale.t.profile.editSubtitleDesigner
  return locale.t.profile.editSubtitleClient
})

const editForm = computed(() => {
  const role = auth.user?.role
  if (role === 'agent' || role === 'seller') return AgentProfileEditForm
  if (role === 'designer') return DesignerProfileEditForm
  return ClientProfileEditForm
})
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="locale.t.profile.editProfile"
      :subtitle="editSubtitle"
      show-back
    />

    <section class="px-4">
      <ProfileGuestCard
        v-if="!auth.isAuthenticated"
        :title="locale.t.profile.settingsGuestTitle"
        :body="locale.t.profile.settingsGuestBody"
        :error="auth.error"
      />

      <component
        :is="editForm"
        v-else
      />
    </section>
  </div>
</template>
