<script setup lang="ts">
import { Loader2, Lock } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AvatarUpload from '@/core/ui/AvatarUpload.vue'
import StickyActionBar from '@/core/ui/StickyActionBar.vue'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { fullName, isValidPersonName } from '@/modules/auth/types/user'
import { navigateBack } from '@/core/lib/navigation'
import LegalEntityVerificationCard from '@/modules/profile/components/LegalEntityVerificationCard.vue'
import { ROUTES } from '@/modules/shell/constants/routes'

const auth = useAuthStore()
const locale = useLocaleStore()
const toast = useToast()
const router = useRouter()
const saving = ref(false)

const user = computed(() => auth.user!)
const t = computed(() => locale.t.profileEdit)

const displayName = computed(() => fullName(user.value))

const form = reactive({
  first_name: user.value.first_name,
  last_name: user.value.last_name ?? '',
})

watch(user, (nextUser) => {
  form.first_name = nextUser.first_name
  form.last_name = nextUser.last_name ?? ''
})

const isLegal = computed(() => user.value.person_type === 'legal_entity')

const personTypeLabel = computed(() => {
  const pt = locale.t.personType
  if (!isLegal.value) return pt.individual
  const state = user.value.person_type_verified
    ? t.value.verified
    : user.value.legal_entity_status === 'pending' ? pt.pending : pt.unverified
  return `${pt.legalEntity} · ${state}`
})

async function save() {
  if (!form.first_name.trim()) {
    toast.error(locale.t.profile.errName)
    return
  }
  if (!isValidPersonName(form.first_name)) {
    toast.error(locale.t.profile.errNameInvalid)
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
    navigateBack(router, ROUTES.profile)
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
  <form
    class="space-y-4"
    @submit.prevent="save"
  >
    <section class="cpe-card items-center text-center">
      <AvatarUpload
        :model-value="user.avatar_file_id"
        :preview-url="user.avatar"
        :name="displayName"
        size="lg"
        @update:model-value="handleAvatarChange"
      />
      <p class="cpe-hint">
        {{ t.clientAvatarHint }}
      </p>
    </section>

    <section class="cpe-card">
      <h2 class="cpe-title">
        {{ t.clientPersonal }}
      </h2>

      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label
            class="cpe-field-label"
            for="client_edit_first_name"
          >
            {{ locale.t.profile.firstName }}
          </label>
          <input
            id="client_edit_first_name"
            v-model="form.first_name"
            type="text"
            autocomplete="given-name"
            class="glass-input"
          >
        </div>
        <div class="space-y-1.5">
          <label
            class="cpe-field-label"
            for="client_edit_last_name"
          >
            {{ locale.t.profile.lastName }}
          </label>
          <input
            id="client_edit_last_name"
            v-model="form.last_name"
            type="text"
            autocomplete="family-name"
            class="glass-input"
          >
        </div>
      </div>

      <div
        v-if="user.phone"
        class="space-y-1.5"
      >
        <span class="cpe-field-label">{{ locale.t.profile.phone }}</span>
        <div class="cpe-readonly">
          <span>{{ user.phone }}</span>
          <Lock
            class="size-4 shrink-0"
            aria-hidden="true"
          />
        </div>
        <p class="cpe-hint">
          {{ t.phoneLocked }}
        </p>
      </div>
    </section>

    <section class="cpe-card">
      <h2 class="cpe-title">
        {{ t.clientLegal }}
      </h2>
      <div class="cpe-readonly">
        <span>{{ personTypeLabel }}</span>
      </div>
    </section>

    <!-- Legal entity: verify (INN + document) to get the badge and Tender. -->
    <LegalEntityVerificationCard v-if="isLegal && !user.person_type_verified" />

    <StickyActionBar class="bottom-4">
      <button
        type="submit"
        class="rb-cta-btn w-full"
        :disabled="saving"
      >
        <Loader2
          v-if="saving"
          class="size-4 animate-spin"
        />
        {{ saving ? locale.t.profile.saving : locale.t.profile.save }}
      </button>
    </StickyActionBar>
  </form>
</template>

<style scoped>
.cpe-card {
  display: flex; flex-direction: column; gap: 14px; padding: 16px;
  background: var(--card); border: 1px solid var(--border); border-radius: var(--rb-r-card); box-shadow: var(--rb-elev-1);
}
.cpe-title { margin: 0; font-size: 14px; font-weight: 700; color: var(--foreground); }
.cpe-field-label { display: block; font-size: 13px; font-weight: 600; color: var(--foreground); }
.cpe-hint { margin: 0; font-size: 12px; line-height: 1.4; color: var(--muted-foreground); }
.cpe-readonly {
  display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 48px; padding: 0 14px;
  border-radius: var(--rb-r-field); border: 1px solid var(--border); background: var(--muted);
  font-size: 15px; font-weight: 600; color: var(--muted-foreground);
}
</style>
