<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ArrowUp, Check, CheckCircle2, ChevronRight, Eraser, Loader2, MapPin, Sparkles, Tag } from '@lucide/vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import ComingSoonPlaceholder from '@/core/ui/ComingSoonPlaceholder.vue'
import Drawer from '@/core/ui/Drawer.vue'
import { regionName } from '@/core/i18n/region-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import {
  AssistantUnavailableError,
  MAX_HISTORY,
  sendAssistantMessage,
  streamAssistantMessage,
  supportsStreaming,
} from '@/modules/assistant/services/assistant.service'
import { useOrderDraftStore } from '@/modules/orders/stores/order-draft.store'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import { fetchRegions } from '@/modules/orders/services/regions.service'
import type { Region } from '@/modules/orders/types/region'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { AssistantDraft, AssistantMessage } from '@/modules/assistant/types/assistant'

const locale = useLocaleStore()
const router = useRouter()
const { haptic } = useTelegram()
const orderDraft = useOrderDraftStore()
const orders = useOrdersStore()

const messages = ref<AssistantMessage[]>([])
const draft = ref<AssistantDraft | null>(null)
const input = ref('')
const sending = ref(false)
/** True once the first streamed chunk has landed — replaces the typing dots. */
const streaming = ref(false)
const error = ref<string | null>(null)
/** The backend answers 503 until a provider key is configured. */
const unavailable = ref(false)

/* Sending the draft straight from the chat: the region is the one optional
   field worth asking for here — files and a map pin still belong to the form. */
const regions = ref<Region[]>([])
const regionId = ref<number | null>(null)
const regionOpen = ref(false)
const sendingOrder = ref(false)
const sentOrderId = ref<number | null>(null)

const feedRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)

const suggestions = computed(() => [
  locale.t.assistant.suggestion1,
  locale.t.assistant.suggestion2,
  locale.t.assistant.suggestion3,
])

const canSend = computed(() => input.value.trim().length > 1 && !sending.value)

const selectedRegion = computed(() =>
  regions.value.find(region => region.id === regionId.value) ?? null,
)

onMounted(() => {
  void scrollToEnd()
  void fetchRegions().then((list) => { regions.value = list }).catch(() => { regions.value = [] })
})

async function scrollToEnd() {
  await nextTick()
  const feed = feedRef.value
  if (feed) feed.scrollTop = feed.scrollHeight
}

async function send(text?: string) {
  const content = (text ?? input.value).trim()
  if (!content || sending.value) return

  haptic('light')
  error.value = null
  draft.value = null
  input.value = ''
  messages.value = [...messages.value, { role: 'user' as const, content }].slice(-MAX_HISTORY)
  sending.value = true
  void scrollToEnd()

  // The streamed bubble grows in place; the final frame replaces its text with
  // the cleaned reply (the draft JSON never reaches it).
  let streamedIndex: number | null = null

  const appendDelta = (chunk: string) => {
    streaming.value = true
    if (streamedIndex === null) {
      messages.value = [...messages.value, { role: 'assistant' as const, content: chunk }]
      streamedIndex = messages.value.length - 1
    }
    else {
      const next = [...messages.value]
      next[streamedIndex] = { role: 'assistant', content: next[streamedIndex].content + chunk }
      messages.value = next
    }
    void scrollToEnd()
  }

  try {
    const answer = supportsStreaming()
      ? await streamAssistantMessage(messages.value, appendDelta)
      : await sendAssistantMessage(messages.value)

    const finalMessage = { role: 'assistant' as const, content: answer.reply }

    if (streamedIndex === null) {
      messages.value = [...messages.value, finalMessage].slice(-MAX_HISTORY)
    }
    else {
      const next = [...messages.value]
      next[streamedIndex] = finalMessage
      messages.value = next.slice(-MAX_HISTORY)
    }

    draft.value = answer.draft
    if (answer.draft) haptic('medium')
  }
  catch (e) {
    // The feature is not switched on yet; anything else is a retryable hiccup.
    if (e instanceof AssistantUnavailableError || (axios.isAxiosError(e) && e.response?.status === 503)) {
      unavailable.value = true
    }
    else {
      // Drop a half-streamed bubble so the user never keeps a truncated answer.
      if (streamedIndex !== null) {
        messages.value = messages.value.filter((_, index) => index !== streamedIndex)
      }
      error.value = locale.t.assistant.errorRetry
      haptic('heavy')
    }
  }
  finally {
    sending.value = false
    streaming.value = false
    void scrollToEnd()
  }
}

/** Send it from here — no detour through the form. */
async function sendDraft() {
  if (!draft.value || sendingOrder.value) return

  haptic('medium')
  sendingOrder.value = true
  error.value = null

  const order = await orders.create({
    ...(draft.value.category_id !== null ? { category_id: draft.value.category_id } : {}),
    description: draft.value.description,
    attachment_file_ids: [],
    ...(regionId.value !== null ? { region_id: regionId.value } : {}),
    ...(draft.value.title ? { title: draft.value.title } : {}),
  })

  sendingOrder.value = false

  if (!order) {
    error.value = locale.t.assistant.draftError
    haptic('heavy')
    return
  }

  haptic('medium')
  sentOrderId.value = order.id
  draft.value = null
  void scrollToEnd()
}

/** For files or a map pin the form is still the right place. */
function editDraft() {
  if (!draft.value) return
  haptic('light')
  orderDraft.set(draft.value)
  void router.push(ROUTES.newOrder)
}

function pickRegion(id: number | null) {
  haptic('light')
  regionId.value = id
  regionOpen.value = false
}

function openSentOrder() {
  if (sentOrderId.value === null) return
  haptic('light')
  void router.push(`${ROUTES.orders}/${sentOrderId.value}`)
}

function clearChat() {
  haptic('light')
  messages.value = []
  draft.value = null
  error.value = null
  sentOrderId.value = null
  regionId.value = null
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void send()
  }
}
</script>

<template>
  <div class="assistant-page">
    <AppHeader
      :title="locale.t.assistant.title"
      show-back
    >
      <template
        v-if="messages.length"
        #trailing
      >
        <button
          type="button"
          class="pressable grid size-9 place-items-center rounded-full bg-muted text-muted-foreground transition active:scale-95"
          :aria-label="locale.t.assistant.clear"
          @click="clearChat"
        >
          <Eraser class="size-4" />
        </button>
      </template>
    </AppHeader>

    <!-- Not switched on yet -->
    <section
      v-if="unavailable"
      class="px-5"
    >
      <GlassCard
        padding="none"
        class="overflow-hidden"
      >
        <ComingSoonPlaceholder :title="locale.t.assistant.unavailableTitle" />
        <p class="px-6 pb-6 text-center text-[13px] leading-relaxed text-muted-foreground">
          {{ locale.t.assistant.unavailableBody }}
        </p>
      </GlassCard>
    </section>

    <template v-else>
      <!-- Conversation -->
      <section
        ref="feedRef"
        class="assistant-feed"
      >
        <!-- Empty state: what this thing is for, in one line plus three openers -->
        <template v-if="!messages.length">
          <div class="flex flex-col items-center gap-3 px-2 py-6 text-center">
            <span class="grid size-12 place-items-center rounded-[var(--rb-r-icon)] bg-secondary text-primary">
              <Sparkles class="size-6" />
            </span>
            <p class="max-w-[17rem] text-[13.5px] leading-relaxed text-muted-foreground">
              {{ locale.t.assistant.intro }}
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <button
              v-for="suggestion in suggestions"
              :key="suggestion"
              type="button"
              class="assistant-suggestion pressable"
              @click="send(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
        </template>

        <div
          v-for="(message, index) in messages"
          :key="index"
          class="assistant-row"
          :class="message.role === 'user' ? 'assistant-row--user' : ''"
        >
          <p
            class="assistant-bubble"
            :class="message.role === 'user' ? 'assistant-bubble--user' : 'assistant-bubble--bot'"
          >
            {{ message.content }}
          </p>
        </div>

        <div
          v-if="sending && !streaming"
          class="assistant-row"
        >
          <p class="assistant-bubble assistant-bubble--bot inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 class="size-3.5 animate-spin" />
            {{ locale.t.assistant.thinking }}
          </p>
        </div>

        <!-- The draft: the point of the whole conversation — sent from here -->
        <GlassCard
          v-if="draft"
          class="mt-1 space-y-3"
        >
          <p class="assistant-eyebrow">
            {{ locale.t.assistant.draftTitle }}
          </p>

          <div class="space-y-1.5">
            <p
              v-if="draft.title"
              class="rb-font-display text-[15px] font-extrabold tracking-[-0.01em] text-foreground"
            >
              {{ draft.title }}
            </p>
            <p class="text-[13.5px] leading-relaxed text-foreground">
              {{ draft.description }}
            </p>
          </div>

          <p class="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
            <Tag class="size-3.5 text-primary" />
            {{ draft.category_name ?? locale.t.assistant.draftNoCategory }}
          </p>

          <!-- The one optional field worth asking for in chat -->
          <button
            type="button"
            class="assistant-region"
            @click="haptic('light'); regionOpen = true"
          >
            <MapPin class="size-4 shrink-0 text-primary" />
            <span class="min-w-0 flex-1 truncate text-left">
              {{ selectedRegion ? regionName(selectedRegion, locale.locale) : locale.t.assistant.draftRegionAny }}
            </span>
            <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
          </button>

          <div class="space-y-2">
            <button
              type="button"
              class="pressable flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[14.5px] font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
              :disabled="sendingOrder"
              @click="sendDraft"
            >
              <Loader2
                v-if="sendingOrder"
                class="size-4 animate-spin"
              />
              {{ sendingOrder ? locale.t.assistant.draftSending : locale.t.assistant.draftSend }}
            </button>

            <button
              type="button"
              class="pressable h-10 w-full rounded-2xl border border-border bg-card text-[13px] font-semibold text-foreground transition active:scale-[0.98]"
              :disabled="sendingOrder"
              @click="editDraft"
            >
              {{ locale.t.assistant.draftEdit }}
            </button>
          </div>
        </GlassCard>

        <!-- Sent: the chat closes the loop itself -->
        <GlassCard
          v-if="sentOrderId !== null"
          class="mt-1 space-y-3 text-center"
        >
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-success/12 text-success">
            <CheckCircle2 class="size-6" />
          </span>
          <div class="space-y-1">
            <p class="rb-font-display text-[16px] font-extrabold text-foreground">
              {{ locale.t.assistant.draftSentTitle }} #{{ sentOrderId }}
            </p>
            <p class="text-[12.5px] leading-relaxed text-muted-foreground">
              {{ locale.t.assistant.draftSentBody }}
            </p>
          </div>
          <button
            type="button"
            class="pressable h-11 w-full rounded-2xl bg-primary text-[14.5px] font-bold text-primary-foreground transition active:scale-[0.98]"
            @click="openSentOrder"
          >
            {{ locale.t.assistant.draftView }}
          </button>
        </GlassCard>

        <p
          v-if="error"
          class="rounded-2xl bg-destructive/10 px-4 py-2.5 text-center text-[12.5px] text-destructive"
        >
          {{ error }}
        </p>
      </section>

      <!-- Region picker: regions and Tashkent city only, no districts -->
      <Drawer
        v-model:open="regionOpen"
        :title="locale.t.assistant.draftRegion"
      >
        <div class="min-h-0 flex-1 space-y-1 overflow-y-auto px-5 pb-2 pt-1">
          <button
            type="button"
            class="assistant-option"
            @click="pickRegion(null)"
          >
            <span class="flex-1">{{ locale.t.assistant.draftRegionAny }}</span>
            <Check
              v-if="regionId === null"
              class="size-[18px] shrink-0 text-primary"
            />
          </button>

          <button
            v-for="region in regions"
            :key="region.id"
            type="button"
            class="assistant-option"
            @click="pickRegion(region.id)"
          >
            <span class="flex-1">{{ regionName(region, locale.locale) }}</span>
            <Check
              v-if="regionId === region.id"
              class="size-[18px] shrink-0 text-primary"
            />
          </button>
        </div>
      </Drawer>

      <!-- Composer -->
      <div class="assistant-composer">
        <div class="assistant-composer__inner">
          <textarea
            ref="inputRef"
            v-model="input"
            rows="1"
            :placeholder="locale.t.assistant.placeholder"
            :aria-label="locale.t.assistant.placeholder"
            class="assistant-input"
            @keydown="onKeydown"
          />
          <button
            type="button"
            class="assistant-send"
            :disabled="!canSend"
            :aria-label="locale.t.assistant.send"
            @click="send()"
          >
            <Loader2
              v-if="sending"
              class="size-[18px] animate-spin"
            />
            <ArrowUp
              v-else
              class="size-[18px]"
            />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Fills the layout's main area: the feed scrolls, the composer stays put.
   The negative tail cancels the layout's bottom padding so the composer can
   sit flush with the screen edge in full-chat mode. */
.assistant-page {
  display: flex;
  flex: 1;
  min-height: 0;
  margin-bottom: -1.5rem;
  flex-direction: column;
}

.assistant-feed {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 20px 8px;
  overflow-y: auto;
}

.assistant-row { display: flex; }
.assistant-row--user { justify-content: flex-end; }

.assistant-bubble {
  margin: 0;
  max-width: 84%;
  padding: 10px 14px;
  border-radius: var(--rb-r-card);
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.assistant-bubble--bot {
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--foreground);
  border-bottom-left-radius: 8px;
  box-shadow: var(--rb-elev-1);
}
.assistant-bubble--user {
  background: var(--primary);
  color: var(--primary-foreground);
  border-bottom-right-radius: 8px;
}

.assistant-suggestion {
  width: 100%;
  padding: 11px 14px;
  border: 1px dashed var(--border);
  border-radius: var(--rb-r-field);
  background: var(--card);
  color: var(--foreground);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.assistant-region {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--rb-r-field);
  background: var(--card);
  color: var(--foreground);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
}

.assistant-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--rb-r-tile);
  background: transparent;
  color: var(--foreground);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}
.assistant-option:active { background: color-mix(in oklab, var(--primary) 8%, transparent); }

.assistant-eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}

/* Sticky composer: the keyboard resizes the Telegram WebView, so it rides
   above the keyboard without any manual offset. */
.assistant-composer {
  position: sticky;
  bottom: 0;
  z-index: 5;
  padding: 8px 20px calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(to top, var(--background) 72%, transparent);
}

.assistant-composer__inner {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 6px 6px 6px 14px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--card);
  box-shadow: var(--rb-elev-1);
}

.assistant-input {
  flex: 1;
  min-width: 0;
  max-height: 120px;
  padding: 8px 0;
  border: 0;
  outline: 0;
  background: transparent;
  resize: none;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.45;
  color: var(--foreground);
}
.assistant-input::placeholder { color: var(--muted-foreground); }

.assistant-send {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border: 0;
  border-radius: 999px;
  background: var(--primary);
  color: var(--primary-foreground);
  cursor: pointer;
  transition: opacity var(--rb-dur) var(--rb-ease), transform var(--rb-dur) var(--rb-ease);
}
.assistant-send:disabled { opacity: 0.4; cursor: default; }
.assistant-send:not(:disabled):active { transform: scale(0.92); }
</style>
