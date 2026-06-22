<script setup lang="ts">
import { CircleCheck, FileText, Loader2, Upload, X } from '@lucide/vue'
import { ref, watch } from 'vue'
import { useFileUpload } from '@/core/composables/useFileUpload'
import { cn } from '@/core/lib/utils'

const props = withDefaults(defineProps<{
  /** Uploaded file id (the value persisted on the resource). */
  modelValue: number | null
  label?: string
  hint?: string
  /** File name to show when a file is already attached (e.g. on edit). */
  currentName?: string | null
  accept?: string
  invalid?: boolean
}>(), {
  currentName: null,
  accept: 'image/png,image/jpeg,image/webp,application/pdf',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { isUploading, error, upload } = useFileUpload()

const inputRef = ref<HTMLInputElement | null>(null)
const fileName = ref<string | null>(props.currentName)

watch(() => props.currentName, (name) => {
  if (!props.modelValue) fileName.value = name
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
    emit('update:modelValue', uploaded.id)
  }

  if (inputRef.value) inputRef.value.value = ''
}

function clear() {
  fileName.value = null
  emit('update:modelValue', null)
}

const hasFile = () => props.modelValue !== null || fileName.value !== null
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="text-sm font-medium">{{ label }}</label>

    <div
      v-if="hasFile()"
      class="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5"
    >
      <CircleCheck class="size-5 shrink-0 text-emerald-500" />
      <span class="min-w-0 flex-1 truncate text-sm">{{ fileName ?? 'Attached file' }}</span>
      <button
        type="button"
        class="shrink-0 rounded-full p-1 text-muted-foreground transition hover:bg-black/5 dark:hover:bg-white/10"
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
      <Loader2 v-if="isUploading" class="size-4 animate-spin" />
      <Upload v-else class="size-4" />
      {{ isUploading ? 'Uploading…' : 'Upload file' }}
      <FileText v-if="!isUploading" class="size-4 opacity-50" />
    </button>

    <p v-if="hint && !hasFile()" class="text-xs text-muted-foreground">
      {{ hint }}
    </p>

    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      class="hidden"
      @change="onChange"
    >

    <p v-if="error" class="text-xs text-destructive">
      {{ error }}
    </p>
  </div>
</template>
