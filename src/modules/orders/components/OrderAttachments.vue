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
  /** Photos as a swipeable carousel (one photo: full width) and files as compact rows. */
  carousel?: boolean
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

// Carousel state: the active slide follows the scroll position.
const track = ref<HTMLElement | null>(null)
const activeSlide = ref(0)

function onTrackScroll() {
  const el = track.value
  if (!el || el.children.length === 0) return
  const first = el.children[0] as HTMLElement
  const step = first.offsetWidth + 10
  activeSlide.value = Math.min(imageFiles.value.length - 1, Math.max(0, Math.round(el.scrollLeft / step)))
}

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

    <!-- Carousel mode: swipeable photos → lightbox -->
    <div
      v-if="carousel && imageFiles.length"
      class="oa-car"
    >
      <div
        ref="track"
        class="oa-car__track"
        @scroll.passive="onTrackScroll"
      >
        <button
          v-for="(file, index) in imageFiles"
          :key="file.id"
          type="button"
          class="oa-car__slide"
          :class="imageFiles.length === 1 ? 'oa-car__slide--single' : ''"
          :aria-label="file.original_name"
          @click="openLightbox(index)"
        >
          <img
            :src="file.url"
            :alt="file.original_name"
            loading="lazy"
          >
        </button>
      </div>
      <span
        v-if="imageFiles.length > 1"
        class="oa-car__count"
      >{{ activeSlide + 1 }} / {{ imageFiles.length }}</span>
      <div
        v-if="imageFiles.length > 1"
        class="oa-car__dots"
        aria-hidden="true"
      >
        <span
          v-for="(file, index) in imageFiles"
          :key="file.id"
          :class="index === activeSlide ? 'is-on' : ''"
        />
      </div>
    </div>

    <!-- Images: thumbnails → lightbox -->
    <div
      v-else-if="imageFiles.length"
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

    <!-- Carousel mode: compact file rows in one card -->
    <div
      v-if="carousel && otherFiles.length"
      class="oa-rows"
    >
      <a
        v-for="file in otherFiles"
        :key="file.id"
        :href="file.url"
        target="_blank"
        rel="noopener"
        :download="file.original_name"
        class="oa-row"
      >
        <FileText class="size-[18px] shrink-0 text-muted-foreground" />
        <span class="oa-row__name">{{ file.original_name || attachmentType(file) }}</span>
        <span class="oa-row__size">{{ formatFileSize(file.size) }}</span>
        <Download class="size-[18px] shrink-0 text-muted-foreground" />
      </a>
    </div>

    <!-- Non-images: one per row + download -->
    <div
      v-else-if="otherFiles.length"
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

<style scoped>
.oa-car { position: relative; }
.oa-car__track {
  display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;
  margin-inline: -20px; padding-inline: 20px; scroll-padding-inline: 20px;
}
.oa-car__track::-webkit-scrollbar { display: none; }
.oa-car__slide {
  flex: 0 0 calc(100% - 38px); height: 230px; padding: 0; border: 0; border-radius: 22px; overflow: hidden;
  scroll-snap-align: start; background: var(--secondary); cursor: zoom-in;
}
.oa-car__slide--single { flex-basis: 100%; }
.oa-car__slide img { display: block; width: 100%; height: 100%; object-fit: cover; }
.oa-car__count {
  position: absolute; top: 12px; right: 12px; z-index: 1; padding: 4px 10px; border-radius: 999px;
  background: rgba(15, 27, 45, 0.62); color: #fff; font-size: 12.5px; font-weight: 600; font-variant-numeric: tabular-nums;
}
.oa-car__dots { display: flex; justify-content: center; gap: 6px; margin-top: 10px; }
.oa-car__dots span { width: 6px; height: 6px; border-radius: 999px; background: var(--border); transition: width var(--rb-dur) var(--rb-ease), background var(--rb-dur) var(--rb-ease); }
.oa-car__dots span.is-on { width: 18px; background: var(--primary); }

.oa-rows { padding: 2px 16px; border-radius: 22px; background: var(--card); }
.oa-row { display: flex; align-items: center; gap: 10px; min-height: 44px; font-size: 14px; font-weight: 500; color: var(--foreground); text-decoration: none; }
.oa-row + .oa-row { border-top: 1px solid var(--border); }
.oa-row__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oa-row__size { color: var(--muted-foreground); font-variant-numeric: tabular-nums; white-space: nowrap; }
</style>
