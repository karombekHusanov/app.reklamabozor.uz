<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import ProfileGuestCard from '@/modules/profile/components/ProfileGuestCard.vue'
import AgentProfileEditForm from '@/modules/profile/components/edit/AgentProfileEditForm.vue'
import ClientProfileEditForm from '@/modules/profile/components/edit/ClientProfileEditForm.vue'

const auth = useAuthStore()
const locale = useLocaleStore()
const route = useRoute()

// `?as=agent` lets a client open the executor form to BECOME one (the legal
// track is picked inside, `&track=individual|legal`); otherwise the form
// follows the active role. Legacy `?as=designer` links land on the same form.
const target = computed(() => {
  const as = route.query.as
  if (as === 'agent' || as === 'designer') return 'agent'
  return auth.user?.role
})

const editSubtitle = computed(() => {
  const role = target.value
  if (role === 'agent' || role === 'seller') return locale.t.profile.editSubtitleAgent
  return locale.t.profile.editSubtitleClient
})

const editForm = computed(() => {
  const role = target.value
  if (role === 'agent' || role === 'seller') return AgentProfileEditForm
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
