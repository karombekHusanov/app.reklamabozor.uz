<script setup lang="ts">
import { LogIn, MessageCircle, Paperclip, Send } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import Avatar from '@/core/ui/Avatar.vue'
import { Button } from '@/core/ui/button'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { formatMessageTime } from '@/core/lib/date'
import { ROUTES } from '@/modules/shell/constants/routes'
import { fetchChats } from '@/modules/chat/services/chat.service'
import { useChatStore } from '@/modules/chat/stores/chat.store'
import type { Chat } from '@/modules/chat/types/chat'

const auth = useAuthStore()
const chat = useChatStore()
const route = useRoute()
const router = useRouter()
const locale = useLocaleStore()

const agentProfileId = computed(() => {
  const id = Number(route.query.agent)
  return Number.isInteger(id) && id > 0 ? id : null
})

const showAgentEmpty = computed(() => route.query.noChat === '1')

const filteredChats = ref<Chat[]>([])
const filtering = ref(false)

const displayChats = computed(() =>
  agentProfileId.value != null ? filteredChats.value : chat.chats,
)

const pageTitle = computed(() =>
  agentProfileId.value != null
    ? locale.t.chat.agentInboxTitle
    : locale.t.chat.inbox,
)

const pageSubtitle = computed(() => {
  if (agentProfileId.value != null) {
    return locale.t.chat.agentInboxSubtitle
  }
  return locale.t.chat.subtitle
})

async function load() {
  if (!auth.isAuthenticated) {
    return
  }

  if (agentProfileId.value != null) {
    filtering.value = true
    try {
      filteredChats.value = await fetchChats(agentProfileId.value)
    }
    finally {
      filtering.value = false
    }
    return
  }

  await chat.loadChats(true)
}

onMounted(load)
watch(() => [auth.isAuthenticated, agentProfileId.value], load)

function chatTitle(item: Chat) {
  return item.other_participant.company_name || item.other_participant.name
}

function orderLabel(item: Chat) {
  const category = item.order.category
    ? categoryName(item.order.category, locale.locale)
    : item.order.title
  return `#${item.order_id} · ${category ?? ''}`
}

function openThread(item: Chat) {
  router.push(`/chat/${item.order_id}`)
}

function placeOrderWithAgent() {
  if (!agentProfileId.value) {
    return
  }
  router.push({ path: ROUTES.newOrder, query: { agent: String(agentProfileId.value) } })
}
</script>

<template>
  <div>
    <AppHeader
      :title="pageTitle"
      :subtitle="pageSubtitle"
      show-back
    />

    <section class="space-y-3 px-5">
      <template v-if="!auth.isAuthenticated">
        <GlassCard
          padding="none"
          class="overflow-hidden"
        >
          <EmptyState
            :icon="LogIn"
            :title="locale.t.orders.signInTitle"
            :description="locale.t.orders.signInBody"
          >
            <Button
              class="mt-1 rounded-2xl"
              @click="router.push(ROUTES.profile)"
            >
              {{ locale.t.orders.goToProfile }}
            </Button>
          </EmptyState>
        </GlassCard>
      </template>

      <template v-else-if="(filtering || chat.isLoading) && displayChats.length === 0">
        <Skeleton
          v-for="n in 3"
          :key="n"
          class="h-20 w-full rounded-3xl"
        />
      </template>

      <GlassCard
        v-else-if="showAgentEmpty || (agentProfileId && displayChats.length === 0)"
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="MessageCircle"
          :title="locale.t.chat.agentEmptyTitle"
          :description="locale.t.chat.agentEmptyBody"
        >
          <Button
            v-if="agentProfileId"
            class="mt-1 rounded-2xl"
            @click="placeOrderWithAgent"
          >
            <Send class="size-4" />
            {{ locale.t.marketplace.orderFromAgency }}
          </Button>
        </EmptyState>
      </GlassCard>

      <GlassCard
        v-else-if="displayChats.length === 0"
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="MessageCircle"
          :title="locale.t.chat.emptyTitle"
          :description="locale.t.chat.emptyBody"
        />
      </GlassCard>

      <template v-else>
        <GlassCard
          v-for="item in displayChats"
          :key="item.id"
          interactive
          class="flex items-center gap-3"
          @click="openThread(item)"
        >
          <Avatar
            :name="chatTitle(item)"
            size="md"
            class="shrink-0"
          />

          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-2">
              <p class="truncate font-semibold leading-tight">
                {{ chatTitle(item) }}
              </p>
              <span
                v-if="item.last_message"
                class="shrink-0 text-xs text-muted-foreground"
              >
                {{ formatMessageTime(item.last_message.created_at, locale.locale) }}
              </span>
            </div>
            <p class="truncate text-xs text-muted-foreground">
              {{ orderLabel(item) }}
            </p>
            <p
              v-if="item.last_message"
              class="flex items-center gap-1 truncate text-sm text-muted-foreground"
            >
              <Paperclip
                v-if="item.last_message.attachments?.length"
                class="size-3.5 shrink-0"
              />
              <span class="truncate">
                {{ item.last_message.body || (item.last_message.attachments?.length ? locale.t.chat.attachmentLabel : '') }}
              </span>
            </p>
          </div>

          <span
            v-if="item.unread_count > 0"
            class="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          >
            {{ item.unread_count > 9 ? '9+' : item.unread_count }}
          </span>
        </GlassCard>
      </template>

      <p
        v-if="chat.error"
        class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ chat.error }}
      </p>
    </section>
  </div>
</template>
