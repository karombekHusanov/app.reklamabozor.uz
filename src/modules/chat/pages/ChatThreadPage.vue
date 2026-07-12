<script setup lang="ts">
import { MessageCircle } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import Avatar from '@/core/ui/Avatar.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatDaySeparator } from '@/core/lib/date'
import { useChatStore } from '@/modules/chat/stores/chat.store'
import ChatComposer from '@/modules/chat/components/ChatComposer.vue'
import ChatComposerDock from '@/modules/chat/components/ChatComposerDock.vue'
import MessageBubble from '@/modules/chat/components/MessageBubble.vue'
import { buildChatFeed } from '@/modules/chat/lib/chat-feed'
import type { ChatMessage } from '@/modules/chat/types/chat'

const props = defineProps<{ orderId: string }>()

const auth = useAuthStore()
const chat = useChatStore()
const locale = useLocaleStore()
const { haptic } = useTelegram()

const orderId = computed(() => Number(props.orderId))
const bottomAnchor = ref<HTMLElement | null>(null)

// The conversation stays writable while the deal is active.
const writable = computed(() => {
  const status = chat.currentChat?.order?.status
  return status === 'in_progress' || status === 'work_submitted'
})

const feed = computed(() =>
  buildChatFeed(chat.messages, m => ({ senderId: m.sender_id, createdAt: m.created_at })),
)

function daySeparatorLabel(iso: string): string {
  return formatDaySeparator(iso, locale.locale, locale.t.chat.today, locale.t.chat.yesterday)
}

function isMine(message: ChatMessage): boolean {
  return message.sender_id === auth.user?.id
}

const headerTitle = computed(() =>
  chat.currentChat
    ? (chat.currentChat.other_participant.company_name || chat.currentChat.other_participant.name)
    : locale.t.shell.tabs.chat,
)

const headerSubtitle = computed(() => {
  const status = chat.currentChat?.order?.status
  const label = status ? locale.t.orders.status[status] : ''
  return label ? `#${orderId.value} · ${label}` : `#${orderId.value}`
})

function scrollToBottom(smooth = true) {
  void nextTick(() => {
    bottomAnchor.value?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' })
  })
}

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await chat.openThread(orderId.value)
  scrollToBottom(false)

  // Simple polling — 5s keeps the thread fresh without websockets.
  pollTimer = setInterval(() => {
    if (auth.isAuthenticated && chat.currentChat) void chat.poll(orderId.value)
  }, 5000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})

watch(() => chat.messages.length, () => scrollToBottom())

async function handleSend(body: string, fileIds: number[]): Promise<boolean> {
  if ((body === '' && fileIds.length === 0) || chat.isSending) return false
  haptic('light')

  // The whole batch (text + files) is one message.
  const ok = await chat.send(orderId.value, body, fileIds)
  if (ok) haptic('medium')
  return ok
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-6rem)] flex-col">
    <AppHeader show-back>
      <template #heading>
        <div class="flex items-center gap-3">
          <Avatar
            :name="headerTitle"
            size="md"
          />
          <div class="min-w-0">
            <p class="truncate text-lg font-bold leading-tight text-foreground">
              {{ headerTitle }}
            </p>
            <p class="truncate text-xs text-muted-foreground">
              {{ headerSubtitle }}
            </p>
          </div>
        </div>
      </template>
    </AppHeader>

    <section class="chat-surface flex flex-1 flex-col gap-1 px-4 pb-24 pt-3">
      <template v-if="chat.isLoadingThread">
        <Skeleton class="h-12 w-2/3 rounded-2xl" />
        <Skeleton class="ml-auto h-12 w-2/3 rounded-2xl" />
        <Skeleton class="h-12 w-1/2 rounded-2xl" />
      </template>

      <GlassCard
        v-else-if="!chat.currentChat"
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="MessageCircle"
          :title="locale.t.chat.notFoundTitle"
          :description="locale.t.chat.notFoundBody"
        />
      </GlassCard>

      <template v-else>
        <p
          v-if="chat.messages.length === 0"
          class="py-8 text-center text-sm text-muted-foreground"
        >
          {{ locale.t.chat.threadEmpty }}
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
              show-status
              :read="!!item.message.read_at"
            />
          </div>
        </template>

        <div ref="bottomAnchor" />
      </template>

      <p
        v-if="chat.error && chat.currentChat"
        class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ chat.error }}
      </p>
    </section>

    <ChatComposerDock v-if="chat.currentChat">
      <ChatComposer
        v-if="writable"
        :send="handleSend"
        :sending="chat.isSending"
        :max-length="2000"
        @focus="scrollToBottom(false)"
      />
      <p
        v-else
        class="rounded-2xl bg-secondary px-4 py-3 text-center text-sm text-muted-foreground dark:bg-white/5"
      >
        {{ locale.t.chat.closedNote }}
      </p>
    </ChatComposerDock>
  </div>
</template>
