<script setup lang="ts">
import { useProtectedFile } from '@/core/composables/useProtectedFile'
import { isProtectedFileUrl } from '@/core/lib/protected-file'

/**
 * Drop-in replacement for `<a :href target="_blank">` on file URLs. Public
 * `/storage/…` files stay a plain link; protected `/api/v1/files/{id}` files
 * open in the inline `ProtectedFileViewer` (fetched with the Bearer token).
 * Visual classes apply to the link and the button alike.
 */
const props = withDefaults(defineProps<{
  /** File URL; when empty the slot renders as inert text (keeps `v-for` rows simple). */
  href: string | null | undefined
  /** Viewer title + download name hint when the server does not expose one. */
  name?: string
}>(), {
  name: 'file',
})

const { state, openFile } = useProtectedFile()

function open() {
  if (props.href) void openFile(props.href, props.name)
}
</script>

<template>
  <span v-if="!href">
    <slot />
  </span>
  <a
    v-else-if="!isProtectedFileUrl(href)"
    :href="href"
    target="_blank"
    rel="noopener"
  >
    <slot />
  </a>
  <button
    v-else
    type="button"
    class="cursor-pointer text-left"
    :disabled="state.loading"
    :aria-busy="state.loading"
    @click="open"
  >
    <slot />
  </button>
</template>
