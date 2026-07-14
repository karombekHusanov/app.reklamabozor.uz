<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import AvatarUpload from '@/core/ui/AvatarUpload.vue'
import StickyActionBar from '@/core/ui/StickyActionBar.vue'
import { Button } from '@/core/ui/button'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { fullName } from '@/modules/auth/types/user'
import { ROUTES } from '@/modules/shell/constants/routes'

const auth = useAuthStore()
const locale = useLocaleStore()
const toast = useToast()
const router = useRouter()
const saving = ref(false)

const user = computed(() => auth.user!)

const displayName = computed(() => fullName(user.value))

const form = reactive({
  first_name: user.value.first_name,
  last_name: user.value.last_name ?? '',
})

watch(user, (nextUser) => {
  form.first_name = nextUser.first_name
  form.last_name = nextUser.last_name ?? ''
})

async function save() {
  if (!form.first_name.trim()) {
    toast.error(locale.t.profile.errName)
    return
  }

  saving.value = true
  const ok = await auth.updateProfile({
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim() || null,
  })
  saving.value = false

  if (ok) {
    toast.success(locale.t.profile.savedToast)
    void router.push(ROUTES.profile)
  }
}

async function handleAvatarChange(fileId: number | null) {
  const ok = await auth.saveAvatar(fileId)
  if (ok) {
    toast.success(locale.t.profile.savedToast)
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="save">
    <GlassCard class="space-y-4">
      <div class="flex justify-center">
        <AvatarUpload
          :model-value="user.avatar_file_id"
          :preview-url="user.avatar"
          :name="displayName"
          size="lg"
          @update:model-value="handleAvatarChange"
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="client_edit_first_name">
          {{ locale.t.profile.firstName }}
        </label>
        <input
          id="client_edit_first_name"
          v-model="form.first_name"
          type="text"
          class="glass-input"
        >
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="client_edit_last_name">
          {{ locale.t.profile.lastName }}
        </label>
        <input
          id="client_edit_last_name"
          v-model="form.last_name"
          type="text"
          class="glass-input"
        >
      </div>

      <p class="text-xs text-muted-foreground">
        {{ locale.t.profile.phoneReadonly }}
      </p>
    </GlassCard>

    <StickyActionBar>
      <Button
        type="submit"
        class="h-12 w-full rounded-2xl text-base shadow-lg shadow-primary/20"
        :disabled="saving"
      >
        <Loader2 v-if="saving" class="size-4 animate-spin" />
        {{ saving ? locale.t.profile.saving : locale.t.profile.save }}
      </Button>
    </StickyActionBar>
  </form>
</template>
