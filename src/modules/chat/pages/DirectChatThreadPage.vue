<script setup lang="ts">
import { ChevronRight, Copy, EllipsisVertical, LockOpen, MessageCircle, Phone, ShieldCheck, XCircle } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import Avatar from '@/core/ui/Avatar.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Drawer from '@/core/ui/Drawer.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatDaySeparator } from '@/core/lib/date'
import { formatPhone } from '@/core/lib/phone'
import { confirmAction } from '@/core/lib/confirm-action'
import { ROUTES } from '@/modules/shell/constants/routes'
import { useChatStore } from '@/modules/chat/stores/chat.store'
import ChatComposer from '@/modules/chat/components/ChatComposer.vue'
import ChatComposerDock from '@/modules/chat/components/ChatComposerDock.vue'
import MessageBubble from '@/modules/chat/components/MessageBubble.vue'
import { buildChatFeed } from '@/modules/chat/lib/chat-feed'
import CategoryThumb from '@/modules/orders/components/CategoryThumb.vue'
import { formatPrice, isInterestOffer } from '@/modules/orders/lib/order-status'
import type { ChatMessage } from '@/modules/chat/types/chat'

const props = defineProps<{ chatId: string }>()

const auth = useAuthStore()
const chat = useChatStore()
const locale = useLocaleStore()
const router = useRouter()
const { haptic } = useTelegram()
const toast = useToast()

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

/** The other side is an agency (I am the client) or a client (I am the agency). */
const otherIsAgency = computed(() => Boolean(chat.currentChat?.other_participant.agent_profile_id))
const orderId = computed(() => chat.currentChat?.order_id ?? activeOffer.value?.order_id ?? null)
const orderTitle = computed(() => chat.currentChat?.order?.title ?? activeOffer.value?.order_title ?? null)
const phone = computed(() => chat.currentChat?.other_participant.phone ?? null)
const phoneLabel = computed(() => formatPhone(phone.value))
const phoneHint = computed(() => (otherIsAgency.value ? locale.t.chat.agencyPhoneHint : locale.t.chat.clientPhoneHint))
const telHref = computed(() => (phone.value ? `tel:${phone.value.replace(/[^\d+]/g, '')}` : undefined))

const headerSubtitle = computed(() => {
  const role = otherIsAgency.value ? locale.t.chat.roleAgency : locale.t.chat.roleClient
  return orderId.value !== null ? `${role} · ${locale.t.chat.orderRef.replace('{id}', String(orderId.value))}` : role
})

/** Where the response stands, from the viewer's side. */
const offerChip = computed(() => {
  const offer = activeOffer.value
  if (!offer) return null
  if (offer.status === 'accepted') return { label: locale.t.chat.offerAcceptedChip, tone: 'ok' }
  if (activeOfferIsInterest.value) {
    return { label: otherIsAgency.value ? locale.t.orders.interestBadge : locale.t.chat.otklikSent, tone: 'info' }
  }
  return { label: formatPrice(offer.price), tone: 'info' }
})

/* ── chat details sheet (end / reopen live here, not in the header) ── */
const infoOpen = ref(false)

function openInfo() {
  haptic('light')
  infoOpen.value = true
}

async function copyPhone() {
  if (!phone.value) return
  try {
    await navigator.clipboard.writeText(phone.value)
    haptic('light')
    toast.success(locale.t.chat.phoneCopied)
  }
  catch {
    // Clipboard blocked (older WebViews) — the number stays visible to copy by hand.
  }
}

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

  infoOpen.value = false
  void confirmAction({
    title: locale.t.chat.endChat,
    message,
    confirmLabel: locale.t.chat.endChat,
    tone: 'danger',
    icon: XCircle,
  }).then((ok) => { if (ok) void run() })
}

async function handleReopen() {
  infoOpen.value = false
  actionBusy.value = true
  haptic('light')
  const ok = await chat.unblockDirect(directChatId.value)
  if (ok) haptic('medium')
  actionBusy.value = false
}

function openActiveOffer() {
  if (!chat.currentChat) return
  infoOpen.value = false
  // Client → their order page; agency → their offer (or the opportunity).
  if (otherIsAgency.value && orderId.value !== null) {
    router.push(`/orders/${orderId.value}`)
    return
  }
  if (activeOffer.value) router.push(ROUTES.offerDetail(activeOffer.value.id))
  else if (orderId.value !== null) router.push(ROUTES.offerOpportunity(orderId.value))
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-6rem)] flex-col">
    <AppHeader show-back>
      <template #heading>
        <button
          type="button"
          class="ch-id"
          :aria-label="locale.t.chat.infoTitle"
          :disabled="!chat.currentChat"
          @click="openInfo"
        >
          <Avatar
            :name="headerTitle"
            size="md"
          />
          <span class="min-w-0 text-left">
            <span class="block truncate text-[16px] font-bold leading-tight text-foreground">{{ headerTitle }}</span>
            <span class="block truncate text-xs text-muted-foreground">{{ headerSubtitle }}</span>
          </span>
        </button>
      </template>
      <template
        v-if="chat.currentChat"
        #trailing
      >
        <div class="flex items-center gap-1.5">
          <a
            v-if="telHref"
            :href="telHref"
            class="ch-icon-btn ch-icon-btn--call"
            :aria-label="`${locale.t.chat.call}: ${phoneLabel}`"
          >
            <Phone class="size-[18px]" />
          </a>
          <button
            type="button"
            class="ch-icon-btn"
            :aria-label="locale.t.chat.moreActions"
            @click="openInfo"
          >
            <EllipsisVertical class="size-[18px]" />
          </button>
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
        <!-- What this conversation is about — pinned above the messages -->
        <div
          v-if="orderId !== null"
          class="ch-order"
        >
          <button
            type="button"
            class="ch-order__main"
            @click="openActiveOffer"
          >
            <span
              class="ch-order__ic"
              aria-hidden="true"
            >
              <CategoryThumb
                :category="chat.currentChat.order?.category ?? null"
                :size="18"
              />
            </span>
            <span class="min-w-0 flex-1">
              <span class="ch-order__ref">{{ locale.t.chat.orderRef.replace('{id}', String(orderId)) }}</span>
              <span class="ch-order__title">{{ orderTitle || locale.t.agent.yourOffer }}</span>
            </span>
            <span
              v-if="offerChip"
              class="ch-chip"
              :class="offerChip.tone === 'ok' && 'ch-chip--ok'"
            >{{ offerChip.label }}</span>
            <ChevronRight
              class="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </button>

          <a
            v-if="telHref"
            :href="telHref"
            class="ch-order__phone"
          >
            <span
              class="ch-order__phone-ic"
              aria-hidden="true"
            ><Phone class="size-4" /></span>
            <span class="min-w-0 flex-1">
              <span class="ch-order__phone-n">{{ phoneLabel }}</span>
              <span class="ch-order__phone-h">{{ phoneHint }}</span>
            </span>
            <span class="ch-order__call">{{ locale.t.chat.call }}</span>
          </a>
        </div>

        <p
          v-if="chat.messages.length === 0"
          class="py-8 text-center text-sm text-muted-foreground"
        >
          {{ locale.t.chat.directEmpty }}
        </p>

        <template
          v-for="item in feed"
          :key="item.key"
        >
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
      <div
        v-if="!canWrite"
        class="ch-ended"
      >
        <p>{{ locale.t.chat.chatEndedBanner }}</p>
        <button
          v-if="isBlocked && iAmBlocker"
          type="button"
          class="ch-ended__btn"
          :disabled="actionBusy"
          @click="handleReopen"
        >
          <LockOpen class="size-4" />
          {{ locale.t.chat.reopenChat }}
        </button>
      </div>
      <ChatComposer
        v-else
        :send="handleSend"
        :sending="chat.isSending"
        :max-length="2000"
        @focus="scrollToBottom(false)"
      />
    </ChatComposerDock>

    <!-- Chat details: who, how to reach them, the order, and ending the chat -->
    <Drawer
      v-model:open="infoOpen"
      :title="locale.t.chat.infoTitle"
    >
      <div
        v-if="chat.currentChat"
        class="ci"
      >
        <div class="ci__who">
          <Avatar
            :name="headerTitle"
            size="lg"
          />
          <div class="min-w-0">
            <p class="ci__name">
              {{ headerTitle }}
            </p>
            <p class="ci__role">
              {{ otherIsAgency ? locale.t.chat.roleAgency : locale.t.chat.roleClient }}
            </p>
          </div>
        </div>

        <div
          v-if="phone"
          class="ci__row"
        >
          <span
            class="ci__row-ic"
            aria-hidden="true"
          ><Phone class="size-4" /></span>
          <span class="min-w-0 flex-1">
            <span class="ci__row-l">{{ locale.t.chat.phoneLabel }}</span>
            <span class="ci__row-v">{{ phoneLabel }}</span>
          </span>
          <button
            type="button"
            class="ci__mini"
            :aria-label="locale.t.chat.copy"
            @click="copyPhone"
          >
            <Copy class="size-4" />
          </button>
          <a
            :href="telHref"
            class="ci__mini ci__mini--primary"
            :aria-label="locale.t.chat.call"
          >
            <Phone class="size-4" />
          </a>
        </div>

        <button
          v-if="orderId !== null"
          type="button"
          class="ci__row ci__row--link"
          @click="openActiveOffer"
        >
          <span
            class="ci__row-ic"
            aria-hidden="true"
          ><ShieldCheck class="size-4" /></span>
          <span class="min-w-0 flex-1">
            <span class="ci__row-l">{{ locale.t.chat.orderRef.replace('{id}', String(orderId)) }}</span>
            <span class="ci__row-v">{{ orderTitle || locale.t.chat.openOrder }}</span>
          </span>
          <ChevronRight
            class="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </button>

        <div class="ci__danger">
          <button
            v-if="!isBlocked"
            type="button"
            class="ci__end"
            :disabled="actionBusy"
            @click="confirmEndChat"
          >
            <XCircle class="size-[18px]" />
            {{ locale.t.chat.endChat }}
          </button>
          <button
            v-else-if="iAmBlocker"
            type="button"
            class="ci__reopen"
            :disabled="actionBusy"
            @click="handleReopen"
          >
            <LockOpen class="size-[18px]" />
            {{ locale.t.chat.reopenChat }}
          </button>
          <p
            v-if="!isBlocked"
            class="ci__hint"
          >
            {{ locale.t.chat.endChatHint }}
          </p>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
/* header */
.ch-id { display: flex; min-width: 0; align-items: center; gap: 10px; padding: 0; border: 0; background: none; cursor: pointer; text-align: left; -webkit-tap-highlight-color: transparent; }
.ch-icon-btn {
  display: grid; place-items: center; width: 40px; height: 40px; border-radius: 13px; border: 1px solid var(--border);
  background: var(--card); color: var(--foreground); cursor: pointer; transition: transform var(--rb-dur) var(--rb-ease);
}
.ch-icon-btn:active { transform: scale(0.94); }
.ch-icon-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.ch-icon-btn--call { border-color: transparent; background: color-mix(in srgb, var(--success) 14%, var(--card)); color: var(--success); }

/* pinned order card */
.ch-order { overflow: hidden; margin-bottom: 8px; border: 1px solid var(--border); border-radius: var(--rb-r-tile); background: var(--card); box-shadow: var(--rb-elev-1); }
.ch-order__main { display: flex; width: 100%; align-items: center; gap: 10px; padding: 11px 12px; border: 0; background: none; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ch-order__ic { display: grid; flex-shrink: 0; place-items: center; width: 38px; height: 38px; overflow: hidden; border-radius: 12px; background: var(--secondary); color: var(--primary); }
.ch-order__ref { display: block; font-size: 11px; font-weight: 700; color: var(--muted-foreground); }
.ch-order__title { display: block; overflow: hidden; font-size: 13.5px; font-weight: 700; line-height: 1.3; color: var(--foreground); white-space: nowrap; text-overflow: ellipsis; }
.ch-chip { flex-shrink: 0; padding: 4px 9px; border-radius: var(--rb-r-chip); background: var(--secondary); color: var(--secondary-foreground); font-size: 11px; font-weight: 800; white-space: nowrap; }
.ch-chip--ok { background: color-mix(in srgb, var(--success) 15%, var(--card)); color: var(--success); }
.ch-order__phone { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-top: 1px solid var(--border); color: inherit; text-decoration: none; background: color-mix(in srgb, var(--success) 5%, var(--card)); }
.ch-order__phone-ic { display: grid; flex-shrink: 0; place-items: center; width: 38px; height: 38px; border-radius: 12px; background: color-mix(in srgb, var(--success) 15%, var(--card)); color: var(--success); }
.ch-order__phone-n { display: block; font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--foreground); }
.ch-order__phone-h { display: block; font-size: 11px; color: var(--muted-foreground); }
.ch-order__call { flex-shrink: 0; padding: 7px 12px; border-radius: 11px; background: var(--success); color: #fff; font-size: 12.5px; font-weight: 800; }

/* ended */
.ch-ended { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 18px; background: var(--secondary); text-align: center; font-size: 13px; color: var(--muted-foreground); }
.ch-ended p { margin: 0; }
.ch-ended__btn { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 0; border-radius: 12px; background: var(--card); color: var(--primary); font-size: 13px; font-weight: 800; cursor: pointer; }

/* details sheet */
.ci { display: flex; flex-direction: column; gap: 10px; padding: 2px 2px 4px; }
.ci__who { display: flex; align-items: center; gap: 12px; padding: 4px 2px 8px; }
.ci__name { margin: 0; font-family: var(--rb-font-display); font-size: 17px; font-weight: 800; color: var(--foreground); }
.ci__role { margin: 2px 0 0; font-size: 12.5px; color: var(--muted-foreground); }
.ci__row { display: flex; width: 100%; align-items: center; gap: 12px; min-height: 60px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 16px; background: var(--card); color: inherit; text-align: left; }
.ci__row--link { cursor: pointer; }
.ci__row-ic { display: grid; flex-shrink: 0; place-items: center; width: 36px; height: 36px; border-radius: 11px; background: var(--secondary); color: var(--primary); }
.ci__row-l { display: block; font-size: 11.5px; font-weight: 700; color: var(--muted-foreground); }
.ci__row-v { display: block; overflow: hidden; font-size: 14px; font-weight: 700; color: var(--foreground); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ci__mini { display: grid; flex-shrink: 0; place-items: center; width: 40px; height: 40px; border: 1px solid var(--border); border-radius: 12px; background: var(--card); color: var(--foreground); cursor: pointer; }
.ci__mini--primary { border-color: transparent; background: var(--success); color: #fff; }
.ci__danger { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; padding-top: 12px; border-top: 1px solid var(--border); }
.ci__end, .ci__reopen {
  display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; border-radius: 14px; cursor: pointer;
  font-size: 14px; font-weight: 800;
}
.ci__end { border: 1px solid color-mix(in srgb, var(--destructive) 35%, var(--border)); background: color-mix(in srgb, var(--destructive) 7%, var(--card)); color: var(--destructive); }
.ci__reopen { border: 1px solid var(--border); background: var(--card); color: var(--primary); }
.ci__hint { margin: 0; text-align: center; font-size: 11.5px; line-height: 1.4; color: var(--muted-foreground); }
</style>
