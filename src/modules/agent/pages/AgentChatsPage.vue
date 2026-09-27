<script setup lang="ts">
import { MessagesSquare } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
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

    <div
      v-if="chat.isLoading && chat.chats.length === 0"
      class="space-y-2 px-3 pt-3"
    >
      <Skeleton
        v-for="n in 4"
        :key="n"
        class="h-16 w-full rounded-2xl"
      />
    </div>

    <ul
      v-else-if="items.length"
      class="ac-list"
    >
      <li
        v-for="item in items"
        :key="`${item.type}-${item.id}`"
      >
        <button
          type="button"
          class="ac-row"
          @click="open(item)"
        >
          <Avatar
            :name="chatTitle(item)"
            size="md"
            class="shrink-0"
          />
          <span class="ac-row__main">
            <span class="ac-row__top">
              <span class="ac-row__name">{{ chatTitle(item) }}</span>
              <span
                v-if="item.last_message"
                class="ac-row__time"
              >{{ formatMessageTime(item.last_message.created_at) }}</span>
            </span>
            <span class="ac-row__order">{{ chatOrderLabel(item, locale.t.chat, locale.locale) }}</span>
            <span class="ac-row__bottom">
              <span
                class="ac-row__msg"
                :class="{ 'is-unread': item.unread_count > 0 }"
              >{{ item.last_message?.body || (item.last_message?.attachments?.length ? locale.t.chat.attachmentLabel : '') }}</span>
              <span
                v-if="item.unread_count > 0"
                class="ac-row__badge"
              >{{ item.unread_count > 9 ? '9+' : item.unread_count }}</span>
            </span>
          </span>
        </button>
      </li>
    </ul>

    <div
      v-else
      class="ac-empty"
    >
      <span class="ac-empty__ic"><MessagesSquare class="size-9" /></span>
      <h2 class="ac-empty__title">
        {{ empty[0] }}
      </h2>
      <p class="ac-empty__body">
        {{ empty[1] }}
      </p>
      <button
        type="button"
        class="ac-empty__cta"
        @click="router.push(ROUTES.agentHome)"
      >
        {{ t.findOrder }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ac-tabs { display: flex; gap: 18px; overflow-x: auto; padding: 0 18px; scrollbar-width: none; border-bottom: 1px solid var(--border); }
.ac-tabs::-webkit-scrollbar { display: none; }
.ac-tab {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; min-height: 44px; padding: 0;
  border: 0; border-bottom: 2px solid transparent; background: none; color: var(--muted-foreground);
  font-family: inherit; font-size: 14px; font-weight: 500; cursor: pointer;
}
.ac-tab.is-on { border-bottom-color: var(--foreground); color: var(--foreground); font-weight: 600; }
.ac-tab:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.ac-tab__n { font-size: 11px; font-weight: 600; color: var(--muted-foreground); }
.ac-list { margin: 8px 0 0; padding: 0; list-style: none; background: var(--card); }
.ac-list li + li .ac-row { border-top: 1px solid var(--border); }
.ac-row {
  display: flex; width: 100%; align-items: center; gap: 12px; padding: 12px 16px;
  border: 0; background: none; color: var(--foreground); font-family: inherit; text-align: left; cursor: pointer;
}
.ac-row:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
.ac-row__main { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 2px; }
.ac-row__top, .ac-row__bottom { display: flex; align-items: center; gap: 8px; }
.ac-row__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14.5px; font-weight: 600; }
.ac-row__time { flex-shrink: 0; font-size: 11.5px; color: var(--muted-foreground); }
.ac-row__order { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 600; color: var(--primary); }
.ac-row__msg { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: var(--muted-foreground); }
.ac-row__msg.is-unread { color: var(--foreground); font-weight: 600; }
.ac-row__badge {
  flex-shrink: 0; min-width: 20px; height: 20px; padding: 0 6px; box-sizing: border-box; border-radius: 999px;
  background: #e5484d; color: #fff; font-size: 11px; font-weight: 700; line-height: 20px; text-align: center;
}
.ac-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 32px 0; text-align: center; }
.ac-empty__ic { display: grid; place-items: center; width: 84px; height: 84px; border-radius: 999px; background: var(--secondary); color: var(--primary); }
.ac-empty__title { margin: 20px 0 0; font-size: 18px; font-weight: 600; }
.ac-empty__body { margin: 8px 0 0; font-size: 13.5px; line-height: 1.55; color: var(--muted-foreground); }
.ac-empty__cta {
  margin-top: 20px; min-height: 44px; padding: 0 18px; border: 0; border-radius: 12px;
  background: var(--foreground); color: var(--background); font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
}
</style>
