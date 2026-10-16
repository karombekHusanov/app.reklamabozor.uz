import { reactive, readonly } from 'vue'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { openExternalLink } from '@/core/lib/telegram-init'
import { fetchProtectedFile, isProtectedFileUrl, type ProtectedFile } from '@/core/lib/protected-file'

/**
 * Module-level singleton behind the one `<ProtectedFileViewer>` mounted in
 * App.vue — any component can hand it a protected file URL to preview.
 */
const state = reactive({
  open: false,
  loading: false,
  file: null as ProtectedFile | null,
  /** Display title while loading and in the viewer header. */
  title: '',
})

function close() {
  state.open = false
  if (state.file) {
    URL.revokeObjectURL(state.file.objectUrl)
    state.file = null
  }
}

/**
 * Open a file URL: public `/storage/…` links behave as before (external
 * browser inside Telegram, new tab elsewhere); protected `/api/v1/files/{id}`
 * links are fetched with the Bearer token and shown inline in the viewer.
 */
async function openFile(url: string, title = 'file'): Promise<void> {
  if (!isProtectedFileUrl(url)) {
    openExternalLink(url)
    return
  }

  if (state.loading) return

  close()
  state.title = title
  state.loading = true
  state.open = true

  try {
    state.file = await fetchProtectedFile(url, title)
  }
  catch {
    state.open = false
    useToast().error(useLocaleStore().t.ui.fileOpenError)
  }
  finally {
    state.loading = false
  }
}

export function useProtectedFile() {
  return {
    state: readonly(state),
    openFile,
    close,
  }
}
