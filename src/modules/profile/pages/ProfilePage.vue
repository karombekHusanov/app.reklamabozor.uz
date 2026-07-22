<script setup lang="ts">
import { computed, onActivated, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatDate } from '@/core/lib/date'
import { ROUTES } from '@/modules/shell/constants/routes'
import { fullName, isBusinessUser } from '@/modules/auth/types/user'
import ProfileAgentView from '@/modules/profile/components/ProfileAgentView.vue'
import ProfileClientView from '@/modules/profile/components/ProfileClientView.vue'
import ProfileGuestCard from '@/modules/profile/components/ProfileGuestCard.vue'

const auth = useAuthStore()
const agent = useAgentStore()
const router = useRouter()
const locale = useLocaleStore()

const user = computed(() => auth.user)
const displayName = computed(() => (user.value ? fullName(user.value) : ''))
const isProvider = computed(() => (user.value ? isBusinessUser(user.value) : false))
const memberSince = computed(() => (user.value ? formatDate(user.value.created_at, locale.locale) : ''))
const profileTitle = computed(() => locale.t.profile.title)
const profileSubtitle = computed(() => {
  if (!user.value) return locale.t.profile.subtitleUser
  if (isProvider.value) return locale.t.profile.subtitleAgent
  return locale.t.profile.subtitleUser
})

async function load() {
  if (!auth.isAuthenticated) return
  if (isProvider.value) {
    await agent.loadProfile()
  }
}

onMounted(() => void load())
watch(() => auth.isAuthenticated, load)
// Switching the active role may reveal the provider view — load its profile.
watch(() => user.value?.role, load)
onActivated(() => {
  if (auth.isAuthenticated && isProvider.value) {
    void agent.loadProfile(true)
  }
})

function navigate(to: string) {
  router.push(to)
}

async function handleLogout() {
  await auth.logout()
  agent.reset()
  await router.replace(ROUTES.home)
}
</script>

<template>
  <div>
    <AppHeader
      v-if="!user"
      :title="profileTitle"
      :subtitle="profileSubtitle"
    />

    <section>
      <template v-if="auth.isAuthenticated && user">
        <ProfileAgentView
          v-if="isProvider"
          :user="user"
          :profile="agent.profile"
          :display-name="displayName"
          :member-since="memberSince"
          :locale="locale"
          @navigate="navigate"
          @logout="handleLogout"
        />

        <ProfileClientView
          v-else
          :user="user"
          :display-name="displayName"
          :member-since="memberSince"
          :locale="locale"
          @navigate="navigate"
        />

      </template>

      <template v-else>
        <ProfileGuestCard
          :title="locale.t.profile.guestTitle"
          :body="locale.t.profile.guestBody"
          :error="auth.error"
        />
      </template>
    </section>
  </div>
</template>
