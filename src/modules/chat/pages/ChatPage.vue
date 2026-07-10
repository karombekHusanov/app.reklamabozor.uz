<script setup lang="ts">
import { Globe, LogIn, MessageCircle } from '@lucide/vue'
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
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
import { useChatStore } from '@/modules/chat/stores/chat.store'
import type { Chat } from '@/modules/chat/types/chat'

const auth = useAuthStore()
const chat = useChatStore()
const router = useRouter()
const locale = useLocaleStore()

function load() {
  if (auth.isAuthenticated) chat.loadChats(true)
}

onMounted(load)
watch(() => auth.isAuthenticated, load)

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
</script>

<template>
  <div>
    <AppHeader :title="locale.t.shell.tabs.chat" :subtitle="locale.t.chat.subtitle" show-back />

    <section class="space-y-3 px-5">
      <!-- Global community chat — always pinned above the order threads -->
      <GlassCard
        v-if="auth.isAuthenticated"
        interactive
        class="flex items-center gap-3 border-primary/25"
        @click="router.push('/chat/global')"
      >
        <div class="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Globe class="size-5" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold leading-tight">
            {{ locale.t.chat.global.title }}
          </p>
          <p class="truncate text-xs text-muted-foreground">
            {{ locale.t.chat.global.entryBody }}
          </p>
        </div>
      </GlassCard>

      <template v-if="!auth.isAuthenticated">
        <GlassCard padding="none" class="overflow-hidden">
          <EmptyState
            :icon="LogIn"
            :title="locale.t.orders.signInTitle"
            :description="locale.t.orders.signInBody"
          >
            <Button class="mt-1 rounded-2xl" @click="router.push(ROUTES.profile)">
              {{ locale.t.orders.goToProfile }}
            </Button>
          </EmptyState>
        </GlassCard>
      </template>

      <template v-else-if="chat.isLoading && chat.chats.length === 0">
        <Skeleton v-for="n in 3" :key="n" class="h-20 w-full rounded-3xl" />
      </template>

      <GlassCard v-else-if="chat.chats.length === 0" padding="none" class="overflow-hidden">
        <EmptyState
          :icon="MessageCircle"
          :title="locale.t.chat.emptyTitle"
          :description="locale.t.chat.emptyBody"
        />
      </GlassCard>

      <template v-else>
        <GlassCard
          v-for="item in chat.chats"
          :key="item.id"
          interactive
          class="flex items-center gap-3"
          @click="openThread(item)"
        >
          <Avatar :name="chatTitle(item)" size="md" class="shrink-0" />

          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-2">
              <p class="truncate font-semibold leading-tight">
                {{ chatTitle(item) }}
              </p>
              <span v-if="item.last_message" class="shrink-0 text-xs text-muted-foreground">
                {{ formatMessageTime(item.last_message.created_at, locale.locale) }}
              </span>
            </div>
            <p class="truncate text-xs text-muted-foreground">
              {{ orderLabel(item) }}
            </p>
            <p v-if="item.last_message" class="truncate text-sm text-muted-foreground">
              {{ item.last_message.body }}
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

      <p v-if="chat.error" class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {{ chat.error }}
      </p>
    </section>
  </div>
</template>
