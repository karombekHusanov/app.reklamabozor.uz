<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Drawer from '@/core/ui/Drawer.vue'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { isValidPersonName } from '@/modules/auth/types/user'

/**
 * One-time ask for a real name when the Telegram one is unusable ("." or a
 * lone emoji). "Later" hides it for this session only; it comes back next
 * launch until the user sets a name (here or in Profile → Edit).
 */
const DISMISS_KEY = 'adspace_name_prompt_dismissed'

const auth = useAuthStore()
const locale = useLocaleStore()
const toast = useToast()

const t = computed(() => locale.t.namePrompt)

function wasDismissed(): boolean {
  try { return sessionStorage.getItem(DISMISS_KEY) === '1' }
  catch { return false }
}

const dismissed = ref(wasDismissed())
const needsName = computed(() =>
  Boolean(auth.user) && !auth.needsPhone && !isValidPersonName(auth.user?.first_name),
)

const open = ref(false)
watch([needsName, dismissed], ([need, hidden]) => { open.value = need && !hidden }, { immediate: true })

const firstName = ref('')
const lastName = ref('')
const saving = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return
  firstName.value = ''
  lastName.value = auth.user?.last_name ?? ''
})

function later() {
  dismissed.value = true
  try { sessionStorage.setItem(DISMISS_KEY, '1') }
  catch { /* storage blocked — still hidden for this page life */ }
}

// Closing the sheet by swipe/backdrop counts as "later".
watch(open, (isOpen, wasOpen) => {
  if (wasOpen && !isOpen && needsName.value) later()
})

async function save() {
  if (!isValidPersonName(firstName.value)) {
    toast.error(locale.t.profile.errNameInvalid)
    return
  }
  saving.value = true
  const ok = await auth.updateProfile({
    first_name: firstName.value.trim(),
    last_name: lastName.value.trim() || null,
  })
  saving.value = false
  if (ok) toast.success(locale.t.profile.savedToast)
  else toast.error(auth.error ?? locale.t.profile.errName)
}
</script>

<template>
  <Drawer
    v-model:open="open"
    :title="t.title"
  >
    <form
      class="np"
      @submit.prevent="save"
    >
      <p class="np__body">
        {{ t.body }}
      </p>
      <label
        class="np__label"
        for="np_first_name"
      >{{ locale.t.profile.firstName }}</label>
      <input
        id="np_first_name"
        v-model="firstName"
        type="text"
        autocomplete="given-name"
        class="glass-input"
        maxlength="100"
      >
      <label
        class="np__label"
        for="np_last_name"
      >{{ locale.t.profile.lastName }}</label>
      <input
        id="np_last_name"
        v-model="lastName"
        type="text"
        autocomplete="family-name"
        class="glass-input"
        maxlength="100"
      >
      <button
        type="submit"
        class="np__save"
        :disabled="saving"
      >
        {{ t.save }}
      </button>
      <button
        type="button"
        class="np__later"
        @click="later"
      >
        {{ t.later }}
      </button>
    </form>
  </Drawer>
</template>

<style scoped>
.np { display: flex; flex-direction: column; gap: 8px; padding-bottom: 8px; }
.np__body { margin: 0 0 6px; font-size: 13.5px; line-height: 1.4; color: var(--muted-foreground); }
.np__label { margin-top: 4px; font-size: 12.5px; font-weight: 600; color: var(--foreground); }
.np__save {
  min-height: 50px; margin-top: 10px; border: 0; border-radius: 16px; background: var(--primary); color: var(--primary-foreground);
  font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer;
}
.np__save:disabled { opacity: 0.6; }
.np__later { min-height: 44px; border: 0; background: none; color: var(--muted-foreground); font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.np__save:focus-visible, .np__later:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
</style>
