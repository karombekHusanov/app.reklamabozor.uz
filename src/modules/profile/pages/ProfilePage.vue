<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useToast } from '@/core/composables/useToast'
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
const toast = useToast()

const user = computed(() => auth.user)
const displayName = computed(() => (user.value ? fullName(user.value) : ''))
const isProvider = computed(() => (user.value ? isBusinessUser(user.value) : false))
const memberSince = computed(() => (user.value ? formatDate(user.value.created_at, locale.locale) : ''))
const savingProfile = ref(false)
const profileTitle = computed(() => locale.t.profile.title)
const profileSubtitle = computed(() => {
  if (!user.value) return locale.t.profile.subtitleUser
  if (isProvider.value) return locale.t.profile.subtitleAgent
  return locale.t.profile.subtitleUser
})

async function handleAvatarChange(fileId: number | null) {
  await auth.saveAvatar(fileId)
}

async function saveProfile(payload: { first_name: string, last_name: string | null }) {
  if (payload.first_name.trim() === '') {
    toast.error(locale.t.profile.errName)
    return
  }
  savingProfile.value = true
  const ok = await auth.updateProfile({
    first_name: payload.first_name.trim(),
    last_name: payload.last_name,
  })
  savingProfile.value = false

  if (ok) {
    toast.success(locale.t.profile.savedToast)
  }
  else if (auth.error) {
    toast.error(auth.error)
  }
}

async function load() {
  if (!auth.isAuthenticated) return
  if (isProvider.value) {
    await agent.loadProfile()
  }
}

onMounted(() => void load())
watch(() => auth.isAuthenticated, load)

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
          :saving-profile="savingProfile"
          @avatar-change="handleAvatarChange"
          @save-profile="saveProfile"
          @navigate="navigate"
          @logout="handleLogout"
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
