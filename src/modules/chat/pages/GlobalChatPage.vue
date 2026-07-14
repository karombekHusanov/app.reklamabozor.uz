<script setup lang="ts">
import { Globe, Inbox, Loader2, Megaphone, ShieldBan, Timer } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { getApiErrorMessage } from '@/core/api/api-error'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatDaySeparator, formatMessageTime } from '@/core/lib/date'
import {
  fetchGlobalMessages,
  fetchGlobalMeta,
  sendGlobalMessage,
} from '@/modules/chat/services/chat.service'
import ChatComposer from '@/modules/chat/components/ChatComposer.vue'
import ChatComposerDock from '@/modules/chat/components/ChatComposerDock.vue'
import MessageBubble from '@/modules/chat/components/MessageBubble.vue'
import { buildChatFeed } from '@/modules/chat/lib/chat-feed'
import { resolveAgentChat } from '@/modules/chat/lib/open-agent-chat'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { GlobalChatMessage, GlobalChatMeta, GlobalChatSender } from '@/modules/chat/types/chat'

const auth = useAuthStore()
const locale = useLocaleStore()
const route = useRoute()
const router = useRouter()
const { haptic } = useTelegram()

const t = computed(() => locale.t.chat.global)

const meta = ref<GlobalChatMeta | null>(null)
const messages = ref<GlobalChatMessage[]>([])
const isLoading = ref(true)
const isSending = ref(false)
const isLoadingOlder = ref(false)
const hasOlder = ref(false)
const error = ref<string | null>(null)
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

const feed = computed(() =>
  buildChatFeed(messages.value, m => ({ senderId: m.sender.id, createdAt: m.created_at })),
)

function daySeparatorLabel(iso: string): string {
  return formatDaySeparator(iso, locale.locale, locale.t.chat.today, locale.t.chat.yesterday)
}

function senderName(sender: GlobalChatSender): string {
  return sender.company_name || sender.name
}

/** Roles that have an in-app public profile card (not Telegram deep link). */
const IN_APP_PROFILE_ROLES = new Set(['client'])

/** A sender is tappable when there is an in-app profile to land on. */
function canOpenSenderProfile(sender: GlobalChatSender): boolean {
  return sender.agent_profile_id != null || IN_APP_PROFILE_ROLES.has(sender.role)
}

/**
 * Agencies open their marketplace profile; clients/sellers open their public
 * in-app profile. Never auto-open t.me links on name tap — that closes the mini app.
 */
function openSenderProfile(sender: GlobalChatSender) {
  haptic('light')

  if (sender.agent_profile_id != null) {
    void router.push(`/agents/${sender.agent_profile_id}`)
    return
  }

  if (IN_APP_PROFILE_ROLES.has(sender.role)) {
    if (sender.id === auth.user?.id) {
      void router.push(ROUTES.profile)
      return
    }

    void router.push({ name: 'client-detail', params: { id: String(sender.id) } })
  }
}

function isMine(message: GlobalChatMessage): boolean {
  return message.sender.id === auth.user?.id
}

function scrollToBottom(smooth = true) {
  void nextTick(() => {
    bottomAnchor.value?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' })
  })
}

async function redirectAgentDeepLink(): Promise<boolean> {
  const id = Number(route.query.agent)
  if (!Number.isInteger(id) || id <= 0) {
    return false
  }

  if (!auth.isAuthenticated) {
    await router.replace(ROUTES.profile)
    return true
  }

  try {
    const result = await resolveAgentChat(id)

    if (result.kind === 'direct') {
      await router.replace(ROUTES.chatDirect(result.chatId))
      return true
    }

    if (result.kind === 'order') {
      await router.replace(ROUTES.chatOrder(result.orderId))
      return true
    }

    if (result.kind === 'picker') {
      await router.replace({ path: ROUTES.chatThreads, query: { agent: String(id) } })
      return true
    }

    return false
  }
  catch {
    await router.replace({ path: ROUTES.chatThreads, query: { agent: String(id) } })
    return true
  }
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
    const fresh = await fetchGlobalMessages({ after_id: lastId }, { skipErrorToast: true })
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

async function handleSend(body: string, fileIds: number[]): Promise<boolean> {
  if ((body === '' && fileIds.length === 0) || isSending.value || !canWrite.value) return false
  isSending.value = true
  error.value = null
  haptic('light')

  try {
    // The whole batch (text + files) is one message.
    messages.value = [...messages.value, await sendGlobalMessage(body, fileIds)]
    haptic('medium')
    scrollToBottom()
    // Refresh cooldown/ban state from the server after each send.
    meta.value = await fetchGlobalMeta()
    return true
  }
  catch (err) {
    error.value = getApiErrorMessage(err)
    // Rules may have changed mid-flight (ban, cooldown, disabled).
    try {
      meta.value = await fetchGlobalMeta()
    }
    catch { /* keep the previous meta */ }
    return false
  }
  finally {
    isSending.value = false
  }
}

onMounted(() => {
  void (async () => {
    if (await redirectAgentDeepLink()) {
      return
    }
    await load()
    pollTimer = setInterval(() => void poll(), 5000)
  })()
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
          <div class="min-w-0 flex-1">
            <p class="truncate text-lg font-bold leading-tight text-foreground">
              {{ t.title }}
            </p>
            <p class="truncate text-xs text-muted-foreground">
              {{ t.subtitle }}
            </p>
          </div>
          <!-- Escape hatch to the per-order chat inbox (the tab bar is hidden here). -->
          <button
            v-if="auth.isAuthenticated"
            type="button"
            class="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition active:scale-95"
            :aria-label="locale.t.chat.inbox"
            @click="router.push('/chat/threads')"
          >
            <Inbox class="size-5" />
          </button>
        </div>
      </template>
    </AppHeader>

    <section class="chat-surface flex flex-1 flex-col gap-1 px-4 pb-28 pt-3">
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

        <template v-for="item in feed" :key="item.key">
          <div v-if="item.kind === 'date'" class="chat-day-pill my-1">
            {{ daySeparatorLabel(item.date) }}
          </div>

          <div
            v-else
            class="flex"
            :class="[
              isMine(item.message) ? 'justify-end' : 'justify-start',
              item.first ? 'mt-2' : 'mt-0.5',
            ]"
          >
            <MessageBubble
              :mine="isMine(item.message)"
              :body="item.message.body"
              :attachments="item.message.attachments"
              :created-at="item.message.created_at"
              :show-tail="item.last"
              :show-name="item.first"
              :sender-name="senderName(item.message.sender)"
              :sender-role="item.message.sender.role"
              :sender-clickable="canOpenSenderProfile(item.message.sender)"
              @sender-click="openSenderProfile(item.message.sender)"
            />
          </div>
        </template>

        <div ref="bottomAnchor" />
      </template>

      <p v-if="error" class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {{ error }}
      </p>
    </section>

    <!-- Composer with rule-driven states -->
    <ChatComposerDock>
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

      <ChatComposer
        v-else
        :send="handleSend"
        :sending="isSending"
        :max-length="meta?.max_message_length ?? 500"
        @focus="scrollToBottom(false)"
      />
    </ChatComposerDock>
  </div>
</template>
