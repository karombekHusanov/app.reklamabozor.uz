<script setup lang="ts">
import { Check, CheckCheck, FileText } from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatMessageTime } from '@/core/lib/date'
import type { ChatAttachment } from '@/modules/chat/types/chat'

const props = withDefaults(defineProps<{
  mine: boolean
  body: string
  createdAt: string
  attachments?: ChatAttachment[]
  /** Last bubble in a same-sender run — gets the "tail" corner. */
  showTail?: boolean
  /** First bubble in a run — shows the sender name (incoming only). */
  showName?: boolean
  senderName?: string
  senderRole?: string
  /** Makes the sender name a tap target (emits `sender-click`). */
  senderClickable?: boolean
  /** Order chats show sent/read ticks on outgoing bubbles; the global chat doesn't. */
  showStatus?: boolean
  read?: boolean
}>(), {
  attachments: () => [],
  showTail: false,
  showName: false,
  senderName: '',
  senderRole: '',
  senderClickable: false,
  showStatus: false,
  read: false,
})

const emit = defineEmits<{
  /** The sender name was tapped — open their profile. */
  'sender-click': []
}>()

const locale = useLocaleStore()

// One message can mix media: images render as an album, documents as rows.
const images = computed(() =>
  props.attachments.filter(file => (file.mime_type ?? '').startsWith('image/')),
)
const docs = computed(() =>
  props.attachments.filter(file => !(file.mime_type ?? '').startsWith('image/')),
)
const hasAttachments = computed(() => props.attachments.length > 0)

/** Album cell spans: with an odd count the first image takes the full row. */
function spansFullRow(index: number): boolean {
  return images.value.length > 1 && images.value.length % 2 === 1 && index === 0
}

const time = computed(() => formatMessageTime(props.createdAt, locale.locale))

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div
    class="break-words"
    :class="[
      hasAttachments ? 'w-[70vw] max-w-[17rem] p-1' : 'max-w-[80%] px-3.5 py-2',
      mine
        ? ['bg-primary text-primary-foreground', showTail ? 'rounded-2xl rounded-br-md' : 'rounded-2xl']
        : ['bg-card text-foreground shadow-sm dark:bg-white/10', showTail ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl'],
    ]"
  >
    <!-- Sender name (incoming, first of a run) — taps through to the profile -->
    <component
      :is="senderClickable ? 'button' : 'p'"
      v-if="showName && !mine && senderName"
      :type="senderClickable ? 'button' : undefined"
      class="mb-0.5 block text-left text-xs font-semibold"
      :class="[
        hasAttachments ? 'px-1.5 pt-0.5' : '',
        senderRole === 'agent' ? 'text-primary' : 'text-muted-foreground',
        senderClickable ? 'transition active:opacity-60' : '',
      ]"
      @click="senderClickable && emit('sender-click')"
    >
      {{ senderName }}
    </component>

    <!-- Image album: single image full-width, several in a tight grid -->
    <div
      v-if="images.length > 0"
      class="grid gap-0.5 overflow-hidden rounded-lg"
      :class="images.length > 1 ? 'grid-cols-2' : ''"
    >
      <a
        v-for="(image, index) in images"
        :key="image.id"
        :href="image.url"
        target="_blank"
        rel="noopener"
        class="block"
        :class="spansFullRow(index) ? 'col-span-2' : ''"
      >
        <img
          :src="image.url"
          :alt="image.original_name"
          class="w-full object-cover"
          :class="images.length === 1 ? 'max-h-[22rem]' : spansFullRow(index) ? 'aspect-[2/1]' : 'aspect-square'"
          loading="lazy"
        >
      </a>
    </div>

    <!-- Documents: stacked rows, one under another -->
    <div
      v-if="docs.length > 0"
      class="space-y-0.5"
      :class="images.length > 0 ? 'mt-1' : ''"
    >
      <a
        v-for="doc in docs"
        :key="doc.id"
        :href="doc.url"
        target="_blank"
        rel="noopener"
        download
        class="flex items-center gap-3 rounded-lg px-2.5 py-2"
        :class="mine ? 'bg-white/15' : 'bg-black/5 dark:bg-white/10'"
      >
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-lg"
          :class="mine ? 'bg-white/20 text-primary-foreground' : 'bg-primary/10 text-primary'"
        >
          <FileText class="size-5" />
        </span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-medium">{{ doc.original_name }}</span>
          <span
            class="block text-xs"
            :class="mine ? 'text-primary-foreground/70' : 'text-muted-foreground'"
          >{{ formatSize(doc.size) }}</span>
        </span>
      </a>
    </div>

    <!-- Caption + time (+ read ticks in order chats) -->
    <div :class="hasAttachments ? 'px-1.5 pb-0.5 pt-1' : ''">
      <p
        v-if="body"
        class="whitespace-pre-line break-words text-sm leading-relaxed"
      >
        {{ body }}
      </p>
      <div
        class="flex items-center justify-end gap-1"
        :class="[body ? 'mt-1' : '', mine ? 'text-primary-foreground/70' : 'text-muted-foreground']"
      >
        <span class="text-[10px]">{{ time }}</span>
        <CheckCheck v-if="mine && showStatus && read" class="size-3.5" />
        <Check v-else-if="mine && showStatus" class="size-3.5" />
      </div>
    </div>
  </div>
</template>
