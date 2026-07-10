<script setup lang="ts">
import { Globe, Loader2, Megaphone, Send, ShieldBan, Timer } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { getApiErrorMessage } from '@/core/api/api-error'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatMessageTime } from '@/core/lib/date'
import {
  fetchGlobalMessages,
  fetchGlobalMeta,
  sendGlobalMessage,
} from '@/modules/chat/services/chat.service'
import type { GlobalChatMessage, GlobalChatMeta, GlobalChatSender } from '@/modules/chat/types/chat'

const auth = useAuthStore()
const locale = useLocaleStore()
const { haptic } = useTelegram()

const t = computed(() => locale.t.chat.global)

const meta = ref<GlobalChatMeta | null>(null)
const messages = ref<GlobalChatMessage[]>([])
const isLoading = ref(true)
const isSending = ref(false)
const isLoadingOlder = ref(false)
const hasOlder = ref(false)
const error = ref<string | null>(null)
const draft = ref('')
const bottomAnchor = ref<HTMLElement | null>(null)

// Live countdown until the user's cooldown lets them write again.
const now = ref(Date.now())
let tickTimer: ReturnType<typeof setInterval> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null

const PAGE_SIZE = 50

const cooldownLeftMs = computed(() => {
  const next = meta.value?.me.next_allowed_at
  if (!next) return 0
  return Math.max(0, new Date(next).getTime() - now.value)
})

const cooldownLabel = computed(() => {
  const totalSeconds = Math.ceil(cooldownLeftMs.value / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`
})

const canWrite = computed(() =>
  meta.value !== null
  && meta.value.enabled
  && !meta.value.me.banned
  && cooldownLeftMs.value === 0,
)

function senderName(sender: GlobalChatSender): string {
  return sender.company_name || sender.name
}

function isMine(message: GlobalChatMessage): boolean {
  return message.sender.id === auth.user?.id
}

function scrollToBottom(smooth = true) {
  void nextTick(() => {
    bottomAnchor.value?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' })
  })
}

async function load() {
  isLoading.value = true
  try {
    const [metaData, messageData] = await Promise.all([fetchGlobalMeta(), fetchGlobalMessages()])
    meta.value = metaData
    messages.value = messageData
    hasOlder.value = messageData.length >= PAGE_SIZE
    scrollToBottom(false)
  }
  catch (err) {
    error.value = getApiErrorMessage(err)
  }
  finally {
    isLoading.value = false
  }
}

async function poll() {
  if (!auth.isAuthenticated || messages.value.length === 0) return
  try {
    const lastId = messages.value[messages.value.length - 1]!.id
    const fresh = await fetchGlobalMessages({ after_id: lastId })
    if (fresh.length > 0) {
      messages.value = [...messages.value, ...fresh]
      scrollToBottom()
    }
  }
  catch {
    // Polling errors are transient; the next tick retries.
  }
}

async function loadOlder() {
  const firstId = messages.value[0]?.id
  if (!firstId || isLoadingOlder.value) return
  isLoadingOlder.value = true
  try {
    const older = await fetchGlobalMessages({ before_id: firstId })
    messages.value = [...older, ...messages.value]
    hasOlder.value = older.length >= PAGE_SIZE
  }
  catch (err) {
    error.value = getApiErrorMessage(err)
  }
  finally {
    isLoadingOlder.value = false
  }
}

async function submit() {
  const body = draft.value.trim()
  if (body === '' || isSending.value || !canWrite.value) return
  isSending.value = true
  error.value = null
  haptic('light')

  try {
    const message = await sendGlobalMessage(body)
    messages.value = [...messages.value, message]
    draft.value = ''
    haptic('medium')
    scrollToBottom()
    // Refresh cooldown/ban state from the server after each send.
    meta.value = await fetchGlobalMeta()
  }
  catch (err) {
    error.value = getApiErrorMessage(err)
    // Rules may have changed mid-flight (ban, cooldown, disabled).
    try {
      meta.value = await fetchGlobalMeta()
    }
    catch { /* keep the previous meta */ }
  }
  finally {
    isSending.value = false
  }
}

onMounted(() => {
  void load()
  pollTimer = setInterval(() => void poll(), 5000)
  tickTimer = setInterval(() => (now.value = Date.now()), 1000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (tickTimer) clearInterval(tickTimer)
})
</script>

<template>
  <div class="flex min-h-[calc(100vh-6rem)] flex-col">
    <AppHeader show-back>
      <template #heading>
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Globe class="size-5" />
          </div>
          <div class="min-w-0">
            <p class="truncate text-lg font-bold leading-tight text-foreground">
              {{ t.title }}
            </p>
            <p class="truncate text-xs text-muted-foreground">
              {{ t.subtitle }}
            </p>
          </div>
        </div>
      </template>
    </AppHeader>

    <section class="flex flex-1 flex-col gap-3 px-5 pb-28">
      <!-- Pinned announcement -->
      <GlassCard
        v-if="meta?.pinned_message"
        class="flex items-start gap-2.5 border-primary/25 bg-primary/5"
      >
        <Megaphone class="mt-0.5 size-4 shrink-0 text-primary" />
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wide text-primary">{{ t.pinned }}</p>
          <p class="mt-0.5 whitespace-pre-line text-sm">{{ meta.pinned_message }}</p>
        </div>
      </GlassCard>

      <template v-if="isLoading">
        <Skeleton class="h-12 w-2/3 rounded-2xl" />
        <Skeleton class="ml-auto h-12 w-2/3 rounded-2xl" />
        <Skeleton class="h-12 w-1/2 rounded-2xl" />
      </template>

      <template v-else>
        <button
          v-if="hasOlder"
          type="button"
          class="mx-auto rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-muted-foreground dark:bg-white/10"
          :disabled="isLoadingOlder"
          @click="loadOlder"
        >
          <Loader2 v-if="isLoadingOlder" class="inline size-3 animate-spin" />
          {{ t.loadOlder }}
        </button>

        <p v-if="messages.length === 0" class="py-8 text-center text-sm text-muted-foreground">
          {{ t.empty }}
        </p>

        <div
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="isMine(message) ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[80%] rounded-2xl px-4 py-2.5"
            :class="isMine(message)
              ? 'rounded-br-md bg-primary text-primary-foreground'
              : 'rounded-bl-md bg-secondary text-foreground dark:bg-white/10'"
          >
            <p
              v-if="!isMine(message)"
              class="text-xs font-semibold"
              :class="message.sender.role === 'agent' ? 'text-primary' : 'text-muted-foreground'"
            >
              {{ senderName(message.sender) }}
            </p>
            <p class="whitespace-pre-line break-words text-sm leading-relaxed">
              {{ message.body }}
            </p>
            <p
              class="mt-1 text-right text-[10px]"
              :class="isMine(message) ? 'text-primary-foreground/70' : 'text-muted-foreground'"
            >
              {{ formatMessageTime(message.created_at, locale.locale) }}
            </p>
          </div>
        </div>

        <div ref="bottomAnchor" />
      </template>

      <p v-if="error" class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {{ error }}
      </p>
    </section>

    <!-- Composer with rule-driven states -->
    <div class="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background px-5 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2.5">
      <p
        v-if="meta && !meta.enabled"
        class="rounded-2xl bg-secondary px-4 py-3 text-center text-sm text-muted-foreground dark:bg-white/5"
      >
        {{ t.disabledNote }}
      </p>

      <p
        v-else-if="meta?.me.banned"
        class="flex items-center justify-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
      >
        <ShieldBan class="size-4 shrink-0" />
        {{ t.bannedNote }}
        <template v-if="meta.me.ban_expires_at">
          {{ formatMessageTime(meta.me.ban_expires_at, locale.locale) }} {{ t.bannedUntil }}
        </template>
      </p>

      <p
        v-else-if="meta && cooldownLeftMs > 0"
        class="flex items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-center text-sm text-muted-foreground dark:bg-white/5"
      >
        <Timer class="size-4 shrink-0" />
        {{ t.cooldownNote }} <span class="font-semibold tabular-nums">{{ cooldownLabel }}</span>
      </p>

      <div v-else class="flex items-end gap-2">
        <textarea
          v-model="draft"
          rows="1"
          :maxlength="meta?.max_message_length ?? 500"
          :placeholder="locale.t.chat.inputPlaceholder"
          class="glass-input max-h-28 flex-1 resize-none"
          @keydown.enter.exact.prevent="submit"
        />
        <Button
          class="size-11 shrink-0 rounded-2xl p-0"
          :disabled="draft.trim() === '' || isSending"
          @click="submit"
        >
          <Loader2 v-if="isSending" class="size-4 animate-spin" />
          <Send v-else class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
