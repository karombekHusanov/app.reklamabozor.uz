<script setup lang="ts">
import { CloudUpload, FileText, ImageIcon, Loader2, X } from '@lucide/vue'
import { inject, ref } from 'vue'
import { useFileUpload } from '@/core/composables/useFileUpload'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { WIZARD_KEY } from '@/modules/orders/components/wizard/context'
import { formatFileSize, isImageFile } from '@/modules/orders/lib/wizard'

const locale = useLocaleStore()
const toast = useToast()
const ctx = inject(WIZARD_KEY)!

const MAX_FILES = 5
const fileInput = ref<HTMLInputElement | null>(null)
const { isUploading, error, upload } = useFileUpload()

function pick() {
  if (isUploading.value || ctx.draft.files.length >= MAX_FILES) return
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return

  const uploaded = await upload(file)
  if (uploaded) {
    ctx.draft.files.push({
      id: uploaded.id,
      url: uploaded.url,
      name: uploaded.original_name,
      mime: uploaded.mime_type,
      size: uploaded.size,
    })
    delete ctx.errors.files
  }
  else if (error.value) {
    // Surface the upload failure as a toast — the inline message is easy to miss.
    toast.error(error.value)
  }
}

function remove(index: number) {
  ctx.draft.files.splice(index, 1)
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <h2 class="text-lg font-bold text-foreground">
        {{ locale.t.orders.wizard.filesTitle }}
      </h2>
      <p class="text-sm text-muted-foreground">
        {{ locale.t.orders.wizard.filesSubtitle }}
      </p>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,application/pdf"
      class="hidden"
      @change="onFileChange"
    >

    <!-- Drop zone -->
    <button
      v-if="ctx.draft.files.length < MAX_FILES"
      type="button"
      class="glass-field flex w-full flex-col items-center gap-2 rounded-2xl px-4 py-8 text-center active:scale-[0.99]"
      :disabled="isUploading"
      @click="pick"
    >
      <span class="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Loader2
          v-if="isUploading"
          class="size-6 animate-spin"
        />
        <CloudUpload
          v-else
          class="size-6"
        />
      </span>
      <span class="text-sm font-semibold text-foreground">
        {{ locale.t.orders.wizard.filesDrop }}
      </span>
      <span class="text-xs text-muted-foreground">
        {{ locale.t.orders.wizard.filesHint }}
      </span>
    </button>

    <p
      v-if="ctx.errors.files"
      class="text-xs text-destructive"
    >
      {{ ctx.errors.files }}
    </p>

    <!-- Uploaded list -->
    <div
      v-if="ctx.draft.files.length > 0"
      class="space-y-2"
    >
      <p class="text-sm font-medium text-foreground">
        {{ locale.t.orders.wizard.filesUploaded }}
      </p>
      <div
        v-for="(file, i) in ctx.draft.files"
        :key="file.id"
        class="flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5"
      >
        <span class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
          <img
            v-if="isImageFile(file.mime)"
            :src="file.url"
            alt=""
            class="size-full object-cover"
          >
          <FileText
            v-else-if="file.mime === 'application/pdf'"
            class="size-5"
          />
          <ImageIcon
            v-else
            class="size-5"
          />
        </span>
        <span class="min-w-0 grow">
          <span class="block truncate text-sm font-medium text-foreground">{{ file.name }}</span>
          <span class="block text-xs text-muted-foreground">{{ formatFileSize(file.size) }}</span>
        </span>
        <button
          type="button"
          class="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition active:scale-90 hover:bg-muted"
          @click="remove(i)"
        >
          <X class="size-4" />
        </button>
      </div>
    </div>
  </div>
</template>
