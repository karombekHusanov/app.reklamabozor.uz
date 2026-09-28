<script setup lang="ts">
import { BadgeCheck, ChevronRight, Copy, Ellipsis, Loader2, LockOpen, MessageCircle, Phone, ShieldCheck, Star, UserRound, XCircle } from '@lucide/vue'
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
import { useRealtimeStore } from '@/core/stores/realtime.store'
import ChatComposer from '@/modules/chat/components/ChatComposer.vue'
import ChatComposerDock from '@/modules/chat/components/ChatComposerDock.vue'
import MessageBubble from '@/modules/chat/components/MessageBubble.vue'
import { buildChatFeed } from '@/modules/chat/lib/chat-feed'
import AgentProfileSheet from '@/modules/marketplace/components/AgentProfileSheet.vue'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import { formatPrice } from '@/modules/orders/lib/order-status'
import type { ChatMessage } from '@/modules/chat/types/chat'

const props = defineProps<{ chatId: string }>()

const auth = useAuthStore()
const chat = useChatStore()
const realtime = useRealtimeStore()
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
const telHref = computed(() => (phone.value ? `tel:${phone.value.replace(/[^\d+]/g, '')}` : undefined))

const headerAvatar = computed(() => chat.currentChat?.other_participant.avatar ?? null)
const avatarFailed = ref(false)
watch(headerAvatar, () => { avatarFailed.value = false })
const headerInitials = computed(() =>
  headerTitle.value.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase(),
)
const agencyStarsCount = computed(() => chat.currentChat?.other_participant.stars_count ?? 0)
const agencyStars = computed(() => {
  const s = chat.currentChat?.other_participant.stars
  return otherIsAgency.value && agencyStarsCount.value > 0 && s != null ? Number(s).toFixed(1) : null
})

/* ── client picks this agency from the thread (Profi-style "Tanlash") ── */
const orders = useOrdersStore()
const picking = ref(false)
const orderOpen = computed(() =>
  ['new', 'offers_sent'].includes(chat.currentChat?.order?.status ?? ''),
)
const isTezkorThread = computed(() => chat.currentChat?.order?.route === 'tezkor')
const canPick = computed(() =>
  otherIsAgency.value
  && activeOffer.value?.status === 'pending'
  && orderOpen.value
  && (isTezkorThread.value || activeOffer.value?.can_accept === true),
)
const picked = computed(() => otherIsAgency.value && activeOffer.value?.status === 'accepted')

async function pickAgency() {
  const offer = activeOffer.value
  if (!offer || orderId.value === null || picking.value) return
  haptic('light')

  // Tender: accepting signs the contract — that drawer lives on the order page.
  if (!isTezkorThread.value) {
    void router.push({ path: `/orders/${orderId.value}`, query: { accept: String(offer.id) } })
    return
  }

  if (!(await confirmAction(locale.t.route.closeConfirm))) return
  picking.value = true
  const ok = await orders.closeTezkor(orderId.value, offer.id)
  picking.value = false
  if (ok) {
    haptic('medium')
    toast.success(locale.t.route.closedToast)
    await chat.refreshDirectThread(directChatId.value)
  }
  else {
    toast.error(orders.error || locale.t.route.errAction)
  }
}

/* ── agency profile sheet (tap the header) ── */
const profileOpen = ref(false)
const agencyProfileId = computed(() => chat.currentChat?.other_participant.agent_profile_id ?? null)

function openHeader() {
  if (otherIsAgency.value && agencyProfileId.value !== null) {
    haptic('light')
    profileOpen.value = true
    return
  }
  openInfo()
}

function openProfileFromInfo() {
  infoOpen.value = false
  profileOpen.value = true
}

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

  // New messages arrive over the socket; poll only while it's down.
  pollTimer = setInterval(() => {
    if (realtime.connected) return
    if (auth.isAuthenticated && chat.currentChat) void chat.pollDirect(directChatId.value)
  }, 5000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
  chat.closeThread()
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
    <AppHeader
      show-back
      flat
    >
      <template #heading>
        <button
          type="button"
          class="ch-id"
          :aria-label="otherIsAgency ? locale.t.orderView.pShowProfile : locale.t.chat.infoTitle"
          :disabled="!chat.currentChat"
          @click="openHeader"
        >
          <span class="ch-photo">
            <img
              v-if="headerAvatar && !avatarFailed"
              :src="headerAvatar"
              :alt="headerTitle"
              @error="avatarFailed = true"
            >
            <span v-else>{{ headerInitials }}</span>
          </span>
          <span class="ch-id__text">
            <span class="ch-name">{{ headerTitle }}</span>
            <span
              v-if="otherIsAgency"
              class="ch-rating"
            >
              <Star
                class="ch-rating__ic"
                aria-hidden="true"
              />
              {{ agencyStars ?? locale.t.orderView.newAgency }}
              <template v-if="agencyStarsCount > 0">
                <MessageCircle
                  class="ch-rating__ic ch-rating__ic--gap"
                  aria-hidden="true"
                />
                {{ locale.t.chat.reviewsCount.replace('{count}', String(agencyStarsCount)) }}
              </template>
            </span>
            <span
              v-else
              class="ch-rating"
            >{{ locale.t.chat.roleClient }}</span>
          </span>
        </button>
      </template>

      <template
        v-if="chat.currentChat"
        #trailing
      >
        <div class="flex items-center">
          <a
            v-if="telHref"
            :href="telHref"
            class="ch-icon-btn"
            :aria-label="`${locale.t.chat.call}: ${phoneLabel}`"
          >
            <Phone class="size-[18px] fill-current" />
          </a>
          <button
            type="button"
            class="ch-icon-btn"
            :aria-label="locale.t.chat.moreActions"
            @click="openInfo"
          >
            <Ellipsis class="size-5" />
          </button>
        </div>
      </template>

      <!-- Client: agreed with this agency? Choose it right here. -->
      <template
        v-if="canPick || picked"
        #below
      >
        <div
          v-if="canPick"
          class="ch-pick"
        >
          <p>{{ locale.t.orderView.pickBanner }}</p>
          <button
            type="button"
            class="ch-pick__btn"
            :disabled="picking || orders.isSubmitting"
            @click="pickAgency"
          >
            <Loader2
              v-if="picking"
              class="size-4 animate-spin"
            />
            {{ locale.t.orderView.pickButton }}
          </button>
        </div>
        <div
          v-else
          class="ch-pick ch-pick--done"
        >
          <BadgeCheck
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <p>{{ locale.t.orderView.pickedBanner }}</p>
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
        :allow-images="chat.currentChat.can_send_images !== false"
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
            :src="headerAvatar"
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

        <button
          v-if="otherIsAgency && agencyProfileId !== null"
          type="button"
          class="ci__row ci__row--link"
          @click="openProfileFromInfo"
        >
          <span
            class="ci__row-ic"
            aria-hidden="true"
          ><UserRound class="size-4" /></span>
          <span class="min-w-0 flex-1">
            <span class="ci__row-v">{{ locale.t.orderView.pShowProfile }}</span>
          </span>
          <ChevronRight
            class="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </button>

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

    <AgentProfileSheet
      v-model:open="profileOpen"
      :profile-id="agencyProfileId"
      :phone="phone"
      :sent-offer="Boolean(activeOffer)"
    />
  </div>
</template>

<style scoped>
/* header (messenger-style, Profi) */
/* width:100% — a button otherwise grows to its text and pushes over the icons. */
.ch-id { display: flex; width: 100%; max-width: 100%; min-width: 0; align-items: center; gap: 10px; padding: 0; border: 0; background: none; cursor: pointer; text-align: left; -webkit-tap-highlight-color: transparent; }
.ch-id:focus-visible { outline: 2px solid var(--ring); outline-offset: 4px; border-radius: 14px; }
.ch-id__text { display: block; min-width: 0; flex: 1; overflow: hidden; }
.ch-photo {
  display: grid; flex-shrink: 0; place-items: center; width: 38px; height: 40px; overflow: hidden;
  border-radius: 11px; background: var(--secondary); color: var(--muted-foreground);
  font-family: var(--rb-font-display); font-size: 13px; font-weight: 800;
}
.ch-photo img { width: 100%; height: 100%; object-fit: cover; }
.ch-name { display: block; overflow: hidden; font-size: 15px; font-weight: 700; line-height: 1.2; color: var(--foreground); white-space: nowrap; text-overflow: ellipsis; }
.ch-rating { display: flex; min-width: 0; align-items: center; gap: 3px; margin-top: 1px; overflow: hidden; white-space: nowrap; font-size: 12px; color: var(--muted-foreground); }
.ch-rating__ic { width: 13px; height: 13px; flex-shrink: 0; }
.ch-rating__ic--gap { margin-left: 6px; }
.ch-icon-btn {
  display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 999px;
  background: none; color: var(--foreground); cursor: pointer;
}
.ch-icon-btn:active { background: var(--secondary); }
.ch-icon-btn:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }

/* choose strip, pinned under the header */
.ch-pick { display: flex; align-items: center; gap: 10px; padding: 8px 12px 8px 14px; border-top: 1px solid var(--border); }
.ch-pick p { flex: 1; margin: 0; font-size: 13px; line-height: 1.35; color: var(--foreground); }
.ch-pick__btn {
  display: inline-flex; flex-shrink: 0; min-height: 36px; align-items: center; gap: 6px; padding: 0 16px;
  border: 0; border-radius: 11px; background: var(--rb-cta); color: #fff; font-size: 13.5px; font-weight: 700; cursor: pointer;
}
.ch-pick__btn:disabled { opacity: 0.6; cursor: default; }
.ch-pick__btn:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
.ch-pick--done { color: var(--success); }
.ch-pick--done p { color: var(--success); font-weight: 700; }

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
