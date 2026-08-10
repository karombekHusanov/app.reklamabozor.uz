<script setup lang="ts">
import { Download, FileText } from '@lucide/vue'
import { computed, ref } from 'vue'
import VueEasyLightbox from 'vue-easy-lightbox'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { OrderAttachment } from '@/modules/orders/types/order'

const props = defineProps<{
  files: OrderAttachment[]
  /** Hide the section heading (caller already rendered one). */
  hideTitle?: boolean
}>()

const locale = useLocaleStore()

const lightboxVisible = ref(false)
const lightboxIndex = ref(0)

function isImage(file: OrderAttachment): boolean {
  return (file.mime_type ?? '').startsWith('image/')
}

const imageFiles = computed(() => props.files.filter(isImage))
const otherFiles = computed(() => props.files.filter(f => !isImage(f)))

const lightboxImgs = computed(() =>
  imageFiles.value.map(f => ({
    src: f.url,
    title: f.original_name || undefined,
  })),
)

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxVisible.value = true
}

function closeLightbox() {
  lightboxVisible.value = false
}

function attachmentType(file: OrderAttachment): string {
  const ext = /\.([a-z0-9]{1,6})$/i.exec(file.original_name ?? '')?.[1]
  if (ext) return ext.toUpperCase()
  const sub = (file.mime_type ?? '').split('/')[1] ?? ''
  if (sub.includes('pdf')) return 'PDF'
  if (sub.includes('word')) return 'DOC'
  if (sub.includes('sheet') || sub.includes('excel')) return 'XLS'
  if (sub.includes('presentation')) return 'PPT'
  if (sub.includes('zip') || sub.includes('rar') || sub.includes('compressed')) return 'ZIP'
  return sub && sub.length <= 4 ? sub.toUpperCase() : ''
}

function formatFileSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div
    v-if="files.length > 0"
    class="space-y-2"
  >
    <p
      v-if="!hideTitle"
      class="order-section-title"
    >
      {{ locale.t.orders.attachedFiles }}
    </p>

    <!-- Images: thumbnails → lightbox -->
    <div
      v-if="imageFiles.length"
      class="grid grid-cols-3 gap-2"
    >
      <button
        v-for="(file, index) in imageFiles"
        :key="file.id"
        type="button"
        class="pressable aspect-square overflow-hidden rounded-2xl border border-border bg-muted/40 dark:bg-white/5"
        @click="openLightbox(index)"
      >
        <img
          :src="file.url"
          :alt="file.original_name"
          class="size-full object-cover"
          loading="lazy"
        >
      </button>
    </div>

    <!-- Non-images: one per row + download -->
    <div
      v-if="otherFiles.length"
      class="space-y-2"
    >
      <a
        v-for="file in otherFiles"
        :key="file.id"
        :href="file.url"
        target="_blank"
        rel="noopener"
        :download="file.original_name"
        class="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-3 py-2.5 transition active:scale-[0.99] dark:bg-white/5"
      >
        <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText class="size-5" />
        </span>
        <span class="flex min-w-0 flex-1 flex-col leading-tight">
          <span class="truncate text-xs font-bold text-foreground">
            {{ file.original_name || attachmentType(file) || locale.t.orders.attachedFiles }}
          </span>
          <span
            v-if="formatFileSize(file.size) || attachmentType(file)"
            class="text-[11px] text-muted-foreground"
          >
            <template v-if="attachmentType(file)">{{ attachmentType(file) }}</template>
            <template v-if="attachmentType(file) && formatFileSize(file.size)"> · </template>
            <template v-if="formatFileSize(file.size)">{{ formatFileSize(file.size) }}</template>
          </span>
        </span>
        <Download class="size-4 shrink-0 text-muted-foreground transition group-active:text-primary" />
      </a>
    </div>

    <VueEasyLightbox
      :visible="lightboxVisible"
      :imgs="lightboxImgs"
      :index="lightboxIndex"
      @hide="closeLightbox"
    />
  </div>
</template>
