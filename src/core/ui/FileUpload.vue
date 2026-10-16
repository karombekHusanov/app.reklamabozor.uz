<script setup lang="ts">
import { CircleCheck, Eye, FileText, Loader2, Upload, X } from '@lucide/vue'
import { ref, watch } from 'vue'
import { useFileUpload } from '@/core/composables/useFileUpload'
import { useProtectedFile } from '@/core/composables/useProtectedFile'
import { cn } from '@/core/lib/utils'
import { useLocaleStore } from '@/core/i18n/locale.store'

const locale = useLocaleStore()

const props = withDefaults(defineProps<{
  /** Uploaded file id (the value persisted on the resource). */
  modelValue: number | null
  label?: string
  hint?: string
  /** File name to show when a file is already attached (e.g. on edit). */
  currentName?: string | null
  /** URL of the already-attached file — adds a "view" action (protected URLs open inline). */
  currentUrl?: string | null
  accept?: string
  invalid?: boolean
}>(), {
  label: undefined,
  hint: undefined,
  currentName: null,
  currentUrl: null,
  accept: 'image/png,image/jpeg,image/webp,application/pdf',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { isUploading, error, upload } = useFileUpload()

const { openFile } = useProtectedFile()

const inputRef = ref<HTMLInputElement | null>(null)
const fileName = ref<string | null>(props.currentName)
// Only the file that came with the resource can be viewed — a fresh upload
// replaces it and the preview action goes away until the form is saved.
const viewUrl = ref<string | null>(props.currentUrl)

watch(() => props.currentName, (name) => {
  if (!props.modelValue) fileName.value = name
})

watch(() => props.currentUrl, (url) => {
  if (!props.modelValue || url) viewUrl.value = url
})

function pick() {
  inputRef.value?.click()
}

async function onChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const uploaded = await upload(file)

  if (uploaded) {
    fileName.value = uploaded.original_name
    viewUrl.value = null
    emit('update:modelValue', uploaded.id)
  }

  if (inputRef.value) inputRef.value.value = ''
}

function clear() {
  fileName.value = null
  viewUrl.value = null
  emit('update:modelValue', null)
}

function view() {
  if (viewUrl.value) void openFile(viewUrl.value, fileName.value ?? props.label ?? 'file')
}

const hasFile = () => props.modelValue !== null || fileName.value !== null
</script>

<template>
  <div class="space-y-1.5">
    <label
      v-if="label"
      class="text-sm font-medium"
    >{{ label }}</label>

    <div
      v-if="hasFile()"
      class="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 dark:bg-white/5"
    >
      <CircleCheck class="size-5 shrink-0 text-emerald-500" />
      <span class="min-w-0 flex-1 truncate text-sm">{{ fileName ?? locale.t.ui.attachedFile }}</span>
      <button
        v-if="viewUrl"
        type="button"
        class="shrink-0 rounded-full p-1 text-muted-foreground transition hover:bg-black/5 dark:hover:bg-white/10"
        :aria-label="locale.t.ui.viewFile"
        :title="locale.t.ui.viewFile"
        @click="view"
      >
        <Eye class="size-4" />
      </button>
      <button
        type="button"
        class="shrink-0 rounded-full p-1 text-muted-foreground transition hover:bg-black/5 dark:hover:bg-white/10"
        :aria-label="locale.t.ui.remove"
        @click="clear"
      >
        <X class="size-4" />
      </button>
    </div>

    <button
      v-else
      type="button"
      :class="cn(
        'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground',
        invalid ? 'border border-dashed border-destructive/50' : 'glass-field',
      )"
      :disabled="isUploading"
      @click="pick"
    >
      <Loader2
        v-if="isUploading"
        class="size-4 animate-spin"
      />
      <Upload
        v-else
        class="size-4"
      />
      {{ isUploading ? locale.t.ui.uploading : locale.t.ui.uploadFile }}
      <FileText
        v-if="!isUploading"
        class="size-4 opacity-50"
      />
    </button>

    <p
      v-if="hint && !hasFile()"
      class="text-xs text-muted-foreground"
    >
      {{ hint }}
    </p>

    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      class="hidden"
      @change="onChange"
    >

    <p
      v-if="error"
      class="text-xs text-destructive"
    >
      {{ error }}
    </p>
  </div>
</template>
