<script setup lang="ts">
import { Download, FileText, Loader2, X } from '@lucide/vue'
import { computed } from 'vue'
import { useProtectedFile } from '@/core/composables/useProtectedFile'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { downloadBlob } from '@/core/lib/protected-file'

/**
 * Full-screen inline preview for protected files (KYC scans, contract /
 * invoice / act PDFs). Mounted once in App.vue; opened through
 * `useProtectedFile().openFile(url, title)`.
 *
 * Blob URLs cannot leave the WebView (`WebApp.openLink` refuses them), so
 * images render in an `<img>` and PDFs in an `<iframe>`; where the WebView
 * cannot render PDFs inline (Android) the user gets the download action.
 */
const { state, close } = useProtectedFile()
const locale = useLocaleStore()

const isImage = computed(() => state.file?.mimeType.startsWith('image/') ?? false)
const isPdf = computed(() => state.file?.mimeType === 'application/pdf')

// Android WebView has no built-in PDF renderer — an <iframe> would stay blank.
const pdfInlineSupported = computed(() => !/android/i.test(navigator.userAgent))

function download() {
  if (state.file) downloadBlob(state.file.objectUrl, state.file.name)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="pfv">
      <div
        v-if="state.open"
        class="pfv pointer-events-auto fixed inset-0 z-[150] flex flex-col bg-background"
        role="dialog"
        aria-modal="true"
        :aria-label="state.title"
      >
        <header class="safe-top flex shrink-0 items-center gap-3 border-b border-border px-4 pb-3 pt-3">
          <p class="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {{ state.file?.name ?? state.title }}
          </p>
          <button
            type="button"
            class="pressable flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            :aria-label="locale.t.common.close"
            @click="close"
          >
            <X class="size-5" />
          </button>
        </header>

        <div class="min-h-0 flex-1 overflow-auto bg-muted/40">
          <div
            v-if="state.loading"
            class="flex h-full flex-col items-center justify-center gap-3 px-6 text-sm text-muted-foreground"
          >
            <Loader2 class="size-6 animate-spin" />
            {{ locale.t.ui.fileLoading }}
          </div>

          <img
            v-else-if="state.file && isImage"
            :src="state.file.objectUrl"
            :alt="state.file.name"
            class="mx-auto block max-h-full max-w-full object-contain"
          >

          <iframe
            v-else-if="state.file && isPdf && pdfInlineSupported"
            :src="state.file.objectUrl"
            :title="state.file.name"
            class="block size-full border-0"
          />

          <div
            v-else-if="state.file"
            class="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground"
          >
            <FileText class="size-10 text-primary" />
            <p>{{ locale.t.ui.filePreviewUnavailable }}</p>
          </div>
        </div>

        <footer
          v-if="state.file"
          class="shrink-0 border-t border-border px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
        >
          <button
            type="button"
            class="pressable flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 text-sm font-semibold text-primary"
            @click="download"
          >
            <Download class="size-4" />
            {{ locale.t.ui.fileDownload }}
          </button>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pfv-enter-active,
.pfv-leave-active {
  transition: opacity 180ms ease;
}

.pfv-enter-from,
.pfv-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .pfv-enter-active,
  .pfv-leave-active {
    transition: none;
  }
}
</style>
