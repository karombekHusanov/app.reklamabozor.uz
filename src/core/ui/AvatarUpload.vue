<script setup lang="ts">
import { Camera, Loader2 } from '@lucide/vue'
import { ref, watch } from 'vue'
import Avatar from '@/core/ui/Avatar.vue'
import { useFileUpload } from '@/core/composables/useFileUpload'

const props = withDefaults(defineProps<{
  /** Uploaded file id (null clears the avatar). */
  modelValue: number | null
  /** Existing avatar URL. */
  previewUrl?: string | null
  name?: string
  size?: 'md' | 'lg' | 'xl'
}>(), {
  previewUrl: null,
  size: 'lg',
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

  if (inputRef.value) inputRef.value.value = ''
}
</script>

<template>
  <div class="space-y-1.5">
    <button type="button" class="relative inline-block" @click="pick">
      <Avatar :name="name" :src="preview" :size="size" class="rounded-full" />

      <span
        class="absolute -bottom-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow dark:border-slate-900"
      >
        <Loader2 v-if="isUploading" class="size-3.5 animate-spin" />
        <Camera v-else class="size-3.5" />
      </span>
    </button>

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
