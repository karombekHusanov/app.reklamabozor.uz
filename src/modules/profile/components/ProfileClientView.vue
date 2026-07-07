<script setup lang="ts">
import { ClipboardList, Loader2, LogOut, PencilLine, Phone, Plus } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'
import AvatarUpload from '@/core/ui/AvatarUpload.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { Button } from '@/core/ui/button'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { User } from '@/modules/auth/types/user'

const props = defineProps<{
  user: User
  displayName: string
  memberSince: string
  locale: any
  savingProfile: boolean
}>()

const emit = defineEmits<{
  avatarChange: [fileId: number | null]
  saveProfile: [payload: { first_name: string, last_name: string | null }]
  logout: []
  navigate: [to: string]
}>()

const editing = ref(false)
const form = reactive({
  first_name: props.user.first_name,
  last_name: props.user.last_name ?? '',
})

const username = computed(() => props.user.username ? `@${props.user.username}` : null)

function startEdit() {
  form.first_name = props.user.first_name
  form.last_name = props.user.last_name ?? ''
  editing.value = true
}

function submit() {
  emit('saveProfile', {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim() || null,
  })
}
</script>

<template>
  <div class="space-y-4">
    <GlassCard class="relative space-y-4">
      <div class="flex items-center gap-4">
        <AvatarUpload
          :model-value="user.avatar_file_id"
          :preview-url="user.avatar"
          :name="displayName"
          size="lg"
          @update:model-value="emit('avatarChange', $event)"
        />
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {{ locale.t.profile.clientBadge }}
          </p>
          <h2 class="mt-1 truncate text-xl font-bold text-foreground">
            {{ displayName }}
          </h2>
          <p v-if="username" class="truncate text-sm text-muted-foreground">
            {{ username }}
          </p>
        </div>
        <button
          v-if="!editing"
          type="button"
          class="absolute right-4 top-4 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition active:scale-95"
          :aria-label="locale.t.profile.editProfile"
          @click="startEdit"
        >
          <PencilLine class="size-4" />
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="pressable rounded-3xl border border-border bg-muted/45 p-4 text-left"
          @click="emit('navigate', ROUTES.newOrder)"
        >
          <Plus class="size-5 text-primary" />
          <p class="mt-4 font-semibold text-foreground">
            {{ locale.t.profile.clientPrimaryCta }}
          </p>
          <p class="mt-1 text-xs leading-snug text-muted-foreground">
            {{ locale.t.profile.clientPrimaryHint }}
          </p>
        </button>
        <button
          type="button"
          class="pressable rounded-3xl border border-border bg-muted/45 p-4 text-left"
          @click="emit('navigate', ROUTES.orders)"
        >
          <ClipboardList class="size-5 text-primary" />
          <p class="mt-4 font-semibold text-foreground">
            {{ locale.t.profile.clientSecondaryCta }}
          </p>
          <p class="mt-1 text-xs leading-snug text-muted-foreground">
            {{ locale.t.profile.clientSecondaryHint }}
          </p>
        </button>
      </div>
    </GlassCard>

    <GlassCard v-if="editing" class="space-y-4">
      <p class="text-sm font-semibold">
        {{ locale.t.profile.editProfile }}
      </p>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="client_first_name">{{ locale.t.profile.firstName }}</label>
        <input id="client_first_name" v-model="form.first_name" type="text" class="glass-input">
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="client_last_name">{{ locale.t.profile.lastName }}</label>
        <input id="client_last_name" v-model="form.last_name" type="text" class="glass-input">
      </div>

      <div class="flex gap-2 pt-1">
        <Button class="h-11 flex-1 rounded-2xl" :disabled="savingProfile" @click="submit">
          <Loader2 v-if="savingProfile" class="size-4 animate-spin" />
          {{ savingProfile ? locale.t.profile.saving : locale.t.profile.save }}
        </Button>
        <Button variant="outline" class="h-11 rounded-2xl" :disabled="savingProfile" @click="editing = false">
          {{ locale.t.profile.cancel }}
        </Button>
      </div>
    </GlassCard>

    <GlassCard v-else class="flex items-center gap-3">
      <Phone class="size-5 shrink-0 text-primary" />
      <div class="min-w-0">
        <p class="text-sm text-muted-foreground">
          {{ locale.t.profile.phone }}
        </p>
        <p class="font-medium">
          {{ user.phone ?? locale.t.common.notAdded }}
        </p>
      </div>
    </GlassCard>

    <GlassCard>
      <p class="text-sm text-muted-foreground">
        {{ locale.t.profile.memberSince }}
      </p>
      <p class="mt-1 font-medium">
        {{ memberSince }}
      </p>
    </GlassCard>

    <Button
      variant="outline"
      class="h-12 w-full rounded-2xl border-destructive/20 text-destructive"
      @click="emit('logout')"
    >
      <LogOut class="size-4" />
      {{ locale.t.profile.signOut }}
    </Button>
  </div>
</template>
