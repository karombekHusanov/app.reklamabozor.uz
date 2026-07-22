<script setup lang="ts">
import { BadgeCheck, Clock } from '@lucide/vue'
import { computed, onMounted, reactive, ref } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import FileUpload from '@/core/ui/FileUpload.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { getApiErrorMessage } from '@/core/api/api-error'
import { fetchLegalEntity, submitLegalEntity } from '@/modules/profile/services/legal-entity.service'

const auth = useAuthStore()
const locale = useLocaleStore()

// Only self-declared legal entities that aren't verified yet manage this here —
// agents/sellers are verified through their role, individuals don't apply.
const applies = computed(() =>
  auth.user?.person_type === 'legal_entity' && !auth.user?.person_type_verified,
)

const status = computed(() => auth.user?.legal_entity_status ?? null)

const form = reactive({
  inn: '',
  company_name: '',
  registration_certificate_file_id: null as number | null,
})
const rejectionReason = ref<string | null>(null)
const submitting = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  if (!applies.value) return
  try {
    const existing = await fetchLegalEntity()
    if (existing) {
      form.inn = existing.inn
      form.company_name = existing.company_name ?? ''
      form.registration_certificate_file_id = existing.registration_certificate_file_id
      rejectionReason.value = existing.status === 'rejected' ? existing.rejection_reason : null
    }
  }
  catch {
    // Non-blocking: the form still works without prefill.
  }
})

async function submit() {
  if (submitting.value) return
  error.value = null

  if (!form.inn.trim()) {
    error.value = locale.t.legalVerify.innRequired
    return
  }

  submitting.value = true
  try {
    await submitLegalEntity({
      inn: form.inn.trim(),
      company_name: form.company_name.trim() || null,
      registration_certificate_file_id: form.registration_certificate_file_id,
    })
    // Re-fetch the user so the badge flips to "pending".
    await auth.refreshUser()
    rejectionReason.value = null
  }
  catch (e) {
    error.value = getApiErrorMessage(e)
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <GlassCard
    v-if="applies"
    class="space-y-3 p-4"
  >
    <div class="flex items-center gap-2">
      <span class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Clock
          v-if="status === 'pending'"
          class="size-4"
        />
        <BadgeCheck
          v-else
          class="size-4"
        />
      </span>
      <h3 class="text-sm font-semibold text-foreground">
        {{ locale.t.legalVerify.title }}
      </h3>
    </div>

    <!-- Awaiting moderation -->
    <p
      v-if="status === 'pending'"
      class="text-[13px] text-muted-foreground"
    >
      {{ locale.t.legalVerify.pending }}
    </p>

    <!-- Submit / resubmit form -->
    <template v-else>
      <p class="text-[12px] leading-snug text-muted-foreground">
        {{ locale.t.legalVerify.desc }}
      </p>

      <p
        v-if="rejectionReason"
        class="rounded-xl bg-destructive/10 px-3 py-2 text-[12px] text-destructive"
      >
        {{ locale.t.legalVerify.rejected }}: {{ rejectionReason }}
      </p>

      <div class="space-y-2.5">
        <label class="block">
          <span class="mb-1 block text-[12px] font-medium text-muted-foreground">{{ locale.t.legalVerify.inn }}</span>
          <input
            v-model="form.inn"
            type="text"
            inputmode="numeric"
            maxlength="20"
            placeholder="123456789"
            class="glass-input h-11 w-full rounded-xl px-3 text-sm"
          >
        </label>

        <label class="block">
          <span class="mb-1 block text-[12px] font-medium text-muted-foreground">{{ locale.t.legalVerify.company }}</span>
          <input
            v-model="form.company_name"
            type="text"
            class="glass-input h-11 w-full rounded-xl px-3 text-sm"
          >
        </label>

        <FileUpload
          v-model="form.registration_certificate_file_id"
          :label="locale.t.legalVerify.doc"
          :hint="locale.t.legalVerify.docHint"
        />
      </div>

      <p
        v-if="error"
        class="text-[12px] text-destructive"
      >
        {{ error }}
      </p>

      <Button
        class="w-full"
        :disabled="submitting"
        @click="submit"
      >
        {{ submitting ? locale.t.legalVerify.submitting : locale.t.legalVerify.submit }}
      </Button>
    </template>
  </GlassCard>
</template>
