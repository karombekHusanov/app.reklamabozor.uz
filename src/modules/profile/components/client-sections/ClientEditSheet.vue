<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import { reactive, watch } from 'vue'
import AvatarUpload from '@/core/ui/AvatarUpload.vue'
import { Button } from '@/core/ui/button'
import type { User } from '@/modules/auth/types/user'

const props = defineProps<{
  user: User
  displayName: string
  locale: any
  open: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [payload: { first_name: string, last_name: string | null }]
  avatarChange: [fileId: number | null]
}>()

const form = reactive({
  first_name: props.user.first_name,
  last_name: props.user.last_name ?? '',
})

watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  form.first_name = props.user.first_name
  form.last_name = props.user.last_name ?? ''
})

function submit() {
  emit('save', {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim() || null,
  })
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-30 flex items-end justify-center bg-black/35 p-4 backdrop-blur-[2px]"
    @click.self="emit('close')"
  >
    <div class="agent-profile-card w-full max-w-lg space-y-4 p-4">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-base font-bold text-foreground">
          {{ locale.t.profile.editProfile }}
        </h3>
        <button
          type="button"
          class="pressable text-sm font-medium text-muted-foreground"
          @click="emit('close')"
        >
          {{ locale.t.profile.cancel }}
        </button>
      </div>

      <div class="flex justify-center">
        <AvatarUpload
          :model-value="user.avatar_file_id"
          :preview-url="user.avatar"
          :name="displayName"
          size="lg"
          @update:model-value="emit('avatarChange', $event)"
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="client_edit_first_name">{{ locale.t.profile.firstName }}</label>
        <input id="client_edit_first_name" v-model="form.first_name" type="text" class="glass-input">
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="client_edit_last_name">{{ locale.t.profile.lastName }}</label>
        <input id="client_edit_last_name" v-model="form.last_name" type="text" class="glass-input">
      </div>

      <Button class="h-11 w-full rounded-2xl" :disabled="saving" @click="submit">
        <Loader2 v-if="saving" class="size-4 animate-spin" />
        {{ saving ? locale.t.profile.saving : locale.t.profile.save }}
      </Button>
    </div>
  </div>
</template>
