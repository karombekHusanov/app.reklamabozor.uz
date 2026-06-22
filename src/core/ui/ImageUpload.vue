<script setup lang="ts">
import { ImagePlus, Loader2, X } from '@lucide/vue'
import { ref, watch } from 'vue'
import { useFileUpload } from '@/core/composables/useFileUpload'
import { cn } from '@/core/lib/utils'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(defineProps<{
  /** Uploaded file id (the value persisted on the resource). */
  modelValue: number | null
  /** Existing image URL to show before the user picks a new one. */
  previewUrl?: string | null
  label?: string
  hint?: string
  class?: HTMLAttributes['class']
}>(), {
  previewUrl: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { isUploading, error, upload } = useFileUpload()

const inputRef = ref<HTMLInputElement | null>(null)
const preview = ref<string | null>(props.previewUrl)

watch(() => props.previewUrl, (url) => {
  if (!props.modelValue) preview.value = url
})

function pick() {
  inputRef.value?.click()
}

async function onChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const uploaded = await upload(file)

  if (uploaded) {
    preview.value = uploaded.url
    emit('update:modelValue', uploaded.id)
  }

  // Allow re-selecting the same file.
  if (inputRef.value) inputRef.value.value = ''
}

function clear() {
  preview.value = null
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="text-sm font-medium">{{ label }}</label>

    <div class="flex items-center gap-4">
      <button
        type="button"
        :class="cn(
          'group glass-field relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl',
          props.class,
        )"
        @click="pick"
      >
        <img v-if="preview" :src="preview" alt="" class="size-full object-cover">
        <ImagePlus v-else class="size-7 text-muted-foreground" />

        <span
          v-if="isUploading"
          class="absolute inset-0 flex items-center justify-center bg-black/40"
        >
          <Loader2 class="size-5 animate-spin text-white" />
        </span>
      </button>

      <div class="min-w-0 space-y-1.5">
        <p v-if="hint" class="text-xs text-muted-foreground">
          {{ hint }}
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
            @click="pick"
          >
            {{ preview ? 'Replace' : 'Upload' }}
          </button>
          <button
            v-if="preview"
            type="button"
            class="glass-chip inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
            @click="clear"
          >
            <X class="size-3" />
            Remove
          </button>
        </div>
      </div>
    </div>

    <input
      ref="inputRef"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      class="hidden"
      @change="onChange"
    >

    <p v-if="error" class="text-xs text-destructive">
      {{ error }}
    </p>
  </div>
</template>
