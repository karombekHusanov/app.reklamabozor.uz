<script setup lang="ts">
import { MessageCircle } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import WebApp from '@twa-dev/sdk'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import Avatar from '@/core/ui/Avatar.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatDaySeparator } from '@/core/lib/date'
import { isInsideTelegram, supportsVersion } from '@/core/lib/telegram-init'
import { ROUTES } from '@/modules/shell/constants/routes'
import { useChatStore } from '@/modules/chat/stores/chat.store'
import ChatComposer from '@/modules/chat/components/ChatComposer.vue'
import ChatComposerDock from '@/modules/chat/components/ChatComposerDock.vue'
import MessageBubble from '@/modules/chat/components/MessageBubble.vue'
import { buildChatFeed } from '@/modules/chat/lib/chat-feed'
import { formatPrice, isInterestOffer } from '@/modules/orders/lib/order-status'
import type { ChatMessage } from '@/modules/chat/types/chat'

const props = defineProps<{ chatId: string }>()

const auth = useAuthStore()
const chat = useChatStore()
const locale = useLocaleStore()
const router = useRouter()
const { haptic } = useTelegram()

const directChatId = computed(() => Number(props.chatId))
const bottomAnchor = ref<HTMLElement | null>(null)
const actionBusy = ref(false)

const feed = computed(() =>
  buildChatFeed(chat.messages, m => ({ senderId: m.sender_id, createdAt: m.created_at })),
)

const canWrite = computed(() => chat.currentChat?.can_write !== false)
const isBlocked = computed(() => Boolean(chat.currentChat?.blocked_at))
const iAmBlocker = computed(() =>
  chat.currentChat?.blocked_by != null
  && chat.currentChat.blocked_by === auth.user?.id,
)
const activeOffer = computed(() => chat.currentChat?.active_offer ?? null)
const activeOfferIsInterest = computed(() =>
  activeOffer.value ? isInterestOffer(activeOffer.value) : false,
)

function daySeparatorLabel(iso: string): string {
  return formatDaySeparator(iso, locale.t.chat.today, locale.t.chat.yesterday)
}

function isMine(message: ChatMessage): boolean {
  return message.sender_id === auth.user?.id
}

function isEvent(message: ChatMessage): boolean {
  return Boolean(message.type && message.type !== 'text')
}

function eventLabel(message: ChatMessage): string {
  if (message.type === 'offer_price_changed') {
    const oldP = formatPrice(Number(message.meta?.old_price ?? 0))
    const newP = formatPrice(Number(message.meta?.new_price ?? 0))
    return locale.t.chat.eventPriceChanged
      .replace('{old}', oldP)
      .replace('{new}', newP)
  }
  if (message.type === 'offer_accepted') {
    return locale.t.chat.eventOfferAccepted
  }
  return message.body
}

const headerTitle = computed(() =>
  chat.currentChat
    ? (chat.currentChat.other_participant.company_name || chat.currentChat.other_participant.name)
    : locale.t.chat.directTitle,
)

const headerSubtitle = computed(() => locale.t.chat.directSubtitle)

function scrollToBottom(smooth = true) {
  void nextTick(() => {
    bottomAnchor.value?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' })
  })
}

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await chat.openDirectThread(directChatId.value)
  scrollToBottom(false)

  pollTimer = setInterval(() => {
    if (auth.isAuthenticated && chat.currentChat) void chat.pollDirect(directChatId.value)
  }, 5000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})

watch(() => chat.messages.length, () => scrollToBottom())

async function handleSend(body: string, fileIds: number[]): Promise<boolean> {
  if (!canWrite.value || (body === '' && fileIds.length === 0) || chat.isSending) return false
  haptic('light')

  const ok = await chat.sendDirect(directChatId.value, body, fileIds)
  if (ok) haptic('medium')
  return ok
}

function confirmEndChat() {
  const message = locale.t.chat.endChatConfirm
  const run = async () => {
    actionBusy.value = true
    haptic('light')
    const ok = await chat.blockDirect(directChatId.value)
    if (ok) haptic('medium')
    actionBusy.value = false
  }

  try {
    if (isInsideTelegram() && supportsVersion('6.2') && typeof WebApp.showConfirm === 'function') {
      WebApp.showConfirm(message, (confirmed) => {
        if (confirmed) void run()
      })
      return
    }
  }
  catch {
    // fall through
  }
  if (window.confirm(message)) void run()
}

async function handleReopen() {
  actionBusy.value = true
  haptic('light')
  const ok = await chat.unblockDirect(directChatId.value)
  if (ok) haptic('medium')
  actionBusy.value = false
}

function openActiveOffer() {
  if (!activeOffer.value || !chat.currentChat) return
  // If the other participant is the agency, current user is the client → order page.
  if (chat.currentChat.other_participant.agent_profile_id) {
    router.push(`/orders/${activeOffer.value.order_id}`)
    return
  }
  router.push(ROUTES.offerDetail(activeOffer.value.id))
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
      <template
        v-if="chat.currentChat"
        #trailing
      >
        <button
          v-if="!isBlocked"
          type="button"
          class="pressable rounded-xl px-2 py-1 text-xs font-semibold text-muted-foreground"
          :disabled="actionBusy"
          @click="confirmEndChat"
        >
          {{ locale.t.chat.endChat }}
        </button>
        <button
          v-else-if="iAmBlocker"
          type="button"
          class="pressable rounded-xl px-2 py-1 text-xs font-semibold text-primary"
          :disabled="actionBusy"
          @click="handleReopen"
        >
          {{ locale.t.chat.reopenChat }}
        </button>
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
        <button
          v-if="activeOffer"
          type="button"
          class="pressable mb-2 w-full rounded-2xl border border-border bg-card/60 px-3.5 py-2.5 text-left dark:bg-white/5"
          @click="openActiveOffer"
        >
          <p class="truncate text-xs font-medium text-muted-foreground">
            #{{ activeOffer.order_id }} · {{ activeOffer.order_title || locale.t.agent.yourOffer }}
          </p>
          <p
            v-if="activeOfferIsInterest"
            class="text-sm font-semibold text-primary"
          >
            {{ locale.t.orders.interestBadge }}
          </p>
          <p
            v-else
            class="text-sm font-semibold text-primary"
          >
            {{ formatPrice(activeOffer.price) }}
          </p>
        </button>

        <p
          v-if="chat.messages.length === 0"
          class="py-8 text-center text-sm text-muted-foreground"
        >
          {{ locale.t.chat.directEmpty }}
        </p>

        <template v-for="item in feed" :key="item.key">
          <div
            v-if="item.kind === 'date'"
            class="chat-day-pill my-1"
          >
            {{ daySeparatorLabel(item.date) }}
          </div>

          <div
            v-else-if="isEvent(item.message)"
            class="my-2 flex justify-center px-4"
          >
            <p class="rounded-full bg-muted/80 px-3 py-1 text-center text-[11px] font-medium text-muted-foreground dark:bg-white/10">
              {{ eventLabel(item.message) }}
            </p>
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
      <p
        v-if="!canWrite"
        class="rounded-2xl bg-muted/80 px-4 py-3 text-center text-sm text-muted-foreground dark:bg-white/10"
      >
        {{ locale.t.chat.chatEndedBanner }}
      </p>
      <ChatComposer
        v-else
        :send="handleSend"
        :sending="chat.isSending"
        :max-length="2000"
        @focus="scrollToBottom(false)"
      />
    </ChatComposerDock>
  </div>
</template>
