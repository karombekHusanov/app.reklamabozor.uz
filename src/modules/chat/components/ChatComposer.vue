<script setup lang="ts">
import { ArrowUp, FileText, Loader2, Paperclip, X } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useFileUpload } from '@/core/composables/useFileUpload'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { UploadedFile } from '@/core/types/api'

const props = withDefaults(defineProps<{
  /** Performs the send; returns true on success so the composer can clear. */
  send: (body: string, fileIds: number[]) => Promise<boolean>
  sending?: boolean
  placeholder?: string
  maxLength?: number
}>(), {
  sending: false,
  placeholder: '',
  maxLength: 4000,
})

const locale = useLocaleStore()
const { isUploading, error, upload } = useFileUpload()

const draft = ref('')
const attachments = ref<UploadedFile[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

function isImage(file: UploadedFile): boolean {
  return (file.mime_type ?? '').startsWith('image/')
}

const canSend = computed(() =>
  (draft.value.trim() !== '' || attachments.value.length > 0)
  && !props.sending
  && !isUploading.value,
)

function pickFiles() {
  fileInput.value?.click()
}

async function onFilesChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = '' // allow re-picking the same file(s)

  // Upload sequentially; each is size-checked, oversized ones are skipped with an error.
  for (const file of files) {
    const uploaded = await upload(file)
    if (uploaded) attachments.value.push(uploaded)
  }
}

function removeAttachment(id: number) {
  attachments.value = attachments.value.filter(file => file.id !== id)
}

async function submit() {
  if (!canSend.value) return

  const ok = await props.send(draft.value.trim(), attachments.value.map(file => file.id))
  if (ok) {
    draft.value = ''
    attachments.value = []
  }
}
</script>

<template>
  <div class="space-y-2">
    <!-- Selected attachments -->
    <div v-if="attachments.length > 0" class="flex gap-2 overflow-x-auto pb-1">
      <div
        v-for="file in attachments"
        :key="file.id"
        class="relative shrink-0"
      >
        <img
          v-if="isImage(file)"
          :src="file.url"
          alt=""
          class="size-16 rounded-xl object-cover"
        >
        <div
          v-else
          class="flex h-16 w-40 items-center gap-2 rounded-xl bg-secondary px-2.5 dark:bg-white/10"
        >
          <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText class="size-4" />
          </span>
          <span class="min-w-0 truncate text-xs font-medium">{{ file.original_name }}</span>
        </div>
        <button
          type="button"
          class="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm transition active:scale-90"
          :aria-label="locale.t.chat.removeAttachment"
          @click="removeAttachment(file.id)"
        >
          <X class="size-3" />
        </button>
      </div>
    </div>

    <p v-if="error" class="px-1 text-xs text-destructive">
      {{ error }}
    </p>

    <!-- Input shell with attach (prefix) + send (suffix) inside it -->
    <div
      class="flex items-end gap-1 rounded-3xl border border-border bg-card py-1 pl-1 pr-1 shadow-sm transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 dark:bg-white/5"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*,application/pdf"
        multiple
        class="hidden"
        @change="onFilesChange"
      >
      <!-- Attach (prefix) -->
      <button
        type="button"
        class="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground active:scale-90 disabled:opacity-50"
        :aria-label="locale.t.chat.attachFile"
        :disabled="isUploading || sending"
        @click="pickFiles"
      >
        <Loader2 v-if="isUploading" class="size-5 animate-spin" />
        <Paperclip v-else class="size-5" />
      </button>

      <textarea
        v-model="draft"
        rows="1"
        :maxlength="maxLength"
        :placeholder="placeholder || locale.t.chat.inputPlaceholder"
        class="max-h-28 flex-1 resize-none bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        @keydown.enter.exact.prevent="submit"
      />

      <!-- Send (suffix) -->
      <button
        type="button"
        class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-90 disabled:opacity-40"
        :aria-label="locale.t.chat.send"
        :disabled="!canSend"
        @click="submit"
      >
        <Loader2 v-if="sending" class="size-4 animate-spin" />
        <ArrowUp v-else class="size-5" />
      </button>
    </div>
  </div>
</template>
