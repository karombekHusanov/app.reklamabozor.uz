<script setup lang="ts">
import { MessagesSquare, Paperclip } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatMessageTime } from '@/core/lib/date'
import { chatOrderLabel, chatRoute, chatTitle } from '@/modules/chat/lib/chat-list'
import { useChatStore } from '@/modules/chat/stores/chat.store'
import type { Chat } from '@/modules/chat/types/chat'
import type { OrderStatus } from '@/modules/orders/types/order'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { ROUTES } from '@/modules/shell/constants/routes'

/** Agent "Chats" tab: the inbox split by where the order stands. */
type Bucket = 'open' | 'work' | 'done' | 'archive'

const BUCKET_OF: Partial<Record<OrderStatus, Bucket>> = {
  awaiting_payment: 'work',
  in_progress: 'work',
  work_submitted: 'work',
  completed: 'done',
  cancelled: 'archive',
}
const BUCKETS: Bucket[] = ['open', 'work', 'done', 'archive']

const locale = useLocaleStore()
const router = useRouter()
const chat = useChatStore()

const active = ref<Bucket>('open')
const t = computed(() => locale.t.agentHome.chats)

/** Direct chats and not-yet-agreed orders are "open". */
function bucketOf(item: Chat): Bucket {
  const status = item.order?.status
  return (status && BUCKET_OF[status]) || 'open'
}

const grouped = computed(() => {
  const out: Record<Bucket, Chat[]> = { open: [], work: [], done: [], archive: [] }
  for (const item of chat.chats) out[bucketOf(item)].push(item)
  return out
})

const tabs = computed(() => BUCKETS.map(key => ({ key, label: t.value.tabs[key], count: grouped.value[key].length })))
const items = computed(() => grouped.value[active.value])
const empty = computed(() => t.value.empty[active.value])

function open(item: Chat) {
  const to = chatRoute(item)
  if (to) void router.push(to)
}

onMounted(() => { void chat.loadChats(true) })
</script>

<template>
  <div class="pb-4">
    <AppHeader :title="t.title" />

    <div
      class="ac-tabs"
      role="tablist"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        class="ac-tab"
        :class="{ 'is-on': active === tab.key }"
        :aria-selected="active === tab.key"
        @click="active = tab.key"
      >
        {{ tab.label }}
        <span
          v-if="tab.count"
          class="ac-tab__n"
        >{{ tab.count }}</span>
      </button>
    </div>

    <section class="space-y-3 px-5 pt-4">
      <template v-if="chat.isLoading && chat.chats.length === 0">
        <Skeleton
          v-for="n in 3"
          :key="n"
          class="h-20 w-full rounded-3xl"
        />
      </template>

      <template v-else-if="items.length">
        <GlassCard
          v-for="item in items"
          :key="`${item.type}-${item.id}`"
          interactive
          class="flex items-center gap-3"
          @click="open(item)"
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
                {{ formatMessageTime(item.last_message.created_at) }}
              </span>
            </div>
            <p class="truncate text-xs text-muted-foreground">
              {{ chatOrderLabel(item, locale.t.chat, locale.locale) }}
            </p>
            <p
              v-if="item.last_message"
              class="flex items-center gap-1 truncate text-sm text-muted-foreground"
              :class="{ 'font-semibold text-foreground': item.unread_count > 0 }"
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

      <GlassCard
        v-else
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="MessagesSquare"
          :title="empty[0]"
          :description="empty[1]"
        >
          <Button
            class="mt-1 rounded-2xl"
            @click="router.push(ROUTES.agentHome)"
          >
            {{ t.findOrder }}
          </Button>
        </EmptyState>
      </GlassCard>

      <p
        v-if="chat.error"
        class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ chat.error }}
      </p>
    </section>
  </div>
</template>

<style scoped>
/* Bucket tabs — underline row above the same card list the client inbox uses. */
.ac-tabs { display: flex; gap: 18px; overflow-x: auto; padding: 0 20px; scrollbar-width: none; border-bottom: 1px solid var(--border); }
.ac-tabs::-webkit-scrollbar { display: none; }
.ac-tab {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; min-height: 44px; padding: 0;
  border: 0; border-bottom: 2px solid transparent; background: none; color: var(--muted-foreground);
  font-family: inherit; font-size: 14px; font-weight: 500; cursor: pointer;
}
.ac-tab.is-on { border-bottom-color: var(--foreground); color: var(--foreground); font-weight: 600; }
.ac-tab:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.ac-tab__n { font-size: 11px; font-weight: 600; color: var(--muted-foreground); }
</style>
