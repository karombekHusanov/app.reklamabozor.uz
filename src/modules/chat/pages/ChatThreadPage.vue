<script setup lang="ts">
import { Loader2, MessageCircle, Send } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import { useTelegram } from '@/core/composables/useTelegram'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatMessageTime } from '@/core/lib/date'
import { useChatStore } from '@/modules/chat/stores/chat.store'

const props = defineProps<{ orderId: string }>()

const auth = useAuthStore()
const chat = useChatStore()
const locale = useLocaleStore()
const { haptic } = useTelegram()

const orderId = computed(() => Number(props.orderId))
const draft = ref('')
const bottomAnchor = ref<HTMLElement | null>(null)

// The conversation stays writable while the deal is active.
const writable = computed(() => {
  const status = chat.currentChat?.order.status
  return status === 'in_progress' || status === 'work_submitted'
})

const headerTitle = computed(() =>
  chat.currentChat
    ? (chat.currentChat.other_participant.company_name || chat.currentChat.other_participant.name)
    : locale.t.shell.tabs.chat,
)

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

async function submit() {
  const body = draft.value.trim()
  if (body === '' || chat.isSending) return
  haptic('light')
  const ok = await chat.send(orderId.value, body)
  if (ok) {
    draft.value = ''
    haptic('medium')
  }
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-6rem)] flex-col">
    <AppHeader :title="headerTitle" :subtitle="`#${orderId}`" show-back />

    <section class="flex flex-1 flex-col gap-3 px-5 pb-28">
      <template v-if="chat.isLoadingThread">
        <Skeleton class="h-12 w-2/3 rounded-2xl" />
        <Skeleton class="ml-auto h-12 w-2/3 rounded-2xl" />
        <Skeleton class="h-12 w-1/2 rounded-2xl" />
      </template>

      <GlassCard v-else-if="!chat.currentChat" padding="none" class="overflow-hidden">
        <EmptyState
          :icon="MessageCircle"
          :title="locale.t.chat.notFoundTitle"
          :description="locale.t.chat.notFoundBody"
        />
      </GlassCard>

      <template v-else>
        <p v-if="chat.messages.length === 0" class="py-8 text-center text-sm text-muted-foreground">
          {{ locale.t.chat.threadEmpty }}
        </p>

        <div
          v-for="message in chat.messages"
          :key="message.id"
          class="flex"
          :class="message.sender_id === auth.user?.id ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[80%] rounded-2xl px-4 py-2.5"
            :class="message.sender_id === auth.user?.id
              ? 'rounded-br-md bg-primary text-primary-foreground'
              : 'rounded-bl-md bg-secondary text-foreground dark:bg-white/10'"
          >
            <p class="whitespace-pre-line break-words text-sm leading-relaxed">
              {{ message.body }}
            </p>
            <p
              class="mt-1 text-right text-[10px]"
              :class="message.sender_id === auth.user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'"
            >
              {{ formatMessageTime(message.created_at, locale.locale) }}
            </p>
          </div>
        </div>

        <div ref="bottomAnchor" />
      </template>

      <p v-if="chat.error && chat.currentChat" class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {{ chat.error }}
      </p>
    </section>

    <!-- Composer -->
    <div
      v-if="chat.currentChat"
      class="fixed inset-x-0 bottom-20 z-20 px-5"
    >
      <div v-if="writable" class="flex items-end gap-2">
        <textarea
          v-model="draft"
          rows="1"
          :placeholder="locale.t.chat.inputPlaceholder"
          class="glass-input max-h-28 flex-1 resize-none"
          @keydown.enter.exact.prevent="submit"
        />
        <Button
          class="size-11 shrink-0 rounded-2xl p-0"
          :disabled="draft.trim() === '' || chat.isSending"
          @click="submit"
        >
          <Loader2 v-if="chat.isSending" class="size-4 animate-spin" />
          <Send v-else class="size-4" />
        </Button>
      </div>
      <p
        v-else
        class="rounded-2xl bg-secondary px-4 py-3 text-center text-sm text-muted-foreground dark:bg-white/5"
      >
        {{ locale.t.chat.closedNote }}
      </p>
    </div>
  </div>
</template>
