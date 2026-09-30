<script setup lang="ts">
import { BadgeCheck, Copy, Phone, Star } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import Avatar from '@/core/ui/Avatar.vue'
import Drawer from '@/core/ui/Drawer.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { memberDuration } from '@/core/lib/date'
import { formatPhone } from '@/core/lib/phone'
import { fullName } from '@/modules/auth/types/user'
import { fetchPublicClient, type PublicClient } from '@/modules/profile/services/clients.service'

/**
 * The client as an agency sees them — opened from the order chat header so the
 * agency can size up who they are talking to without leaving the thread.
 */
const props = defineProps<{
  clientId: number | null
  /** The client's number, when the thread exposes it (live otklik). */
  phone?: string | null
}>()

const open = defineModel<boolean>('open', { default: false })

const locale = useLocaleStore()
const { haptic } = useTelegram()
const toast = useToast()

const client = ref<PublicClient | null>(null)
const loading = ref(false)
const failed = ref(false)
let loadedId: number | null = null

async function load() {
  if (props.clientId == null || loadedId === props.clientId) return
  loading.value = true
  failed.value = false
  try {
    client.value = await fetchPublicClient(props.clientId)
    loadedId = props.clientId
  }
  catch {
    failed.value = true
  }
  finally {
    loading.value = false
  }
}

watch(open, (value) => { if (value) void load() })

const t = computed(() => locale.t.profile)
const name = computed(() => (client.value ? fullName(client.value) : ''))
const rating = computed(() => (client.value?.rating_avg != null ? client.value.rating_avg.toFixed(1) : null))

const stats = computed(() => {
  const c = client.value
  if (!c) return []
  return [
    { key: 'total', label: t.value.clientStatTotal, value: c.total_orders },
    { key: 'done', label: t.value.clientStatCompleted, value: c.completed_orders },
    { key: 'work', label: t.value.clientStatInProgress, value: c.in_progress_orders },
    { key: 'cancel', label: t.value.clientStatCancelled, value: c.cancelled_orders },
  ]
})

const memberLabel = computed(() => {
  if (!client.value) return ''
  const { years, months } = memberDuration(client.value.created_at)
  return years > 0
    ? t.value.clientMemberDuration.replace('{years}', String(years)).replace('{months}', String(months))
    : t.value.clientMemberDurationMonths.replace('{months}', String(Math.max(months, 1)))
})

const phoneLabel = computed(() => formatPhone(props.phone))
const telHref = computed(() => (props.phone ? `tel:${props.phone.replace(/[^\d+]/g, '')}` : undefined))

async function copyPhone() {
  if (!props.phone) return
  try {
    await navigator.clipboard.writeText(props.phone)
    haptic('light')
    toast.success(locale.t.chat.phoneCopied)
  }
  catch {
    // Clipboard blocked (older WebViews) — the number stays visible to copy by hand.
  }
}
</script>

<template>
  <Drawer
    v-model:open="open"
    :title="locale.t.orders.showcase.owner"
  >
    <div class="cps">
      <template v-if="loading && !client">
        <Skeleton class="h-16 w-full rounded-2xl" />
        <Skeleton class="h-24 w-full rounded-2xl" />
      </template>

      <p
        v-else-if="failed"
        class="cps__hint"
      >
        {{ locale.t.chat.notFoundBody }}
      </p>

      <template v-else-if="client">
        <div class="cps__who">
          <Avatar
            :name="name"
            :src="client.avatar"
            size="lg"
          />
          <div class="min-w-0">
            <p class="cps__name">
              {{ name }}
              <BadgeCheck
                v-if="client.is_verified"
                class="cps__verified"
                aria-hidden="true"
              />
            </p>
            <p
              v-if="rating"
              class="cps__rating"
            >
              <Star class="cps__star" />
              {{ rating }} · {{ locale.t.agentHome.anketa.reviews.replace('{count}', String(client.rating_count)) }}
            </p>
            <p
              v-else
              class="cps__rating"
            >
              {{ locale.t.orders.showcase.owner }}
            </p>
          </div>
        </div>

        <!-- Numbers that show how this client behaves -->
        <div class="cps__grid">
          <div
            v-for="stat in stats"
            :key="stat.key"
            class="cps__stat"
          >
            <span class="cps__stat-v">{{ stat.value }}</span>
            <span class="cps__stat-l">{{ stat.label }}</span>
          </div>
        </div>

        <p class="cps__hint">
          {{ memberLabel }}
        </p>

        <div
          v-if="phone"
          class="cps__phone"
        >
          <span class="cps__phone-n">{{ phoneLabel }}</span>
          <button
            type="button"
            class="cps__mini"
            :aria-label="locale.t.chat.copy"
            @click="copyPhone"
          >
            <Copy class="size-4" />
          </button>
          <a
            :href="telHref"
            class="cps__mini cps__mini--primary"
            :aria-label="locale.t.chat.call"
          >
            <Phone class="size-4" />
          </a>
        </div>
      </template>
    </div>
  </Drawer>
</template>

<style scoped>
.cps { display: flex; flex-direction: column; gap: 14px; padding: 4px 20px 20px; }
.cps__who { display: flex; align-items: center; gap: 14px; }
.cps__name { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 18px; font-weight: 700; line-height: 1.2; color: var(--foreground); }
.cps__verified { width: 18px; height: 18px; flex-shrink: 0; color: var(--primary); }
.cps__rating { display: flex; align-items: center; gap: 5px; margin: 3px 0 0; font-size: 13px; color: var(--muted-foreground); }
.cps__star { width: 14px; height: 14px; fill: var(--rb-rating); color: var(--rb-rating); }
.cps__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.cps__stat { display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; border-radius: 16px; background: var(--secondary); }
.cps__stat-v { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--foreground); }
.cps__stat-l { font-size: 12.5px; color: var(--muted-foreground); }
.cps__hint { margin: 0; font-size: 13px; color: var(--muted-foreground); }
.cps__phone { display: flex; align-items: center; gap: 8px; min-height: 52px; padding: 0 8px 0 16px; border-radius: 16px; background: var(--secondary); }
.cps__phone-n { flex: 1; font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--foreground); }
.cps__mini { display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 12px; background: var(--card); color: var(--foreground); cursor: pointer; }
.cps__mini--primary { background: var(--primary); color: var(--primary-foreground); }
</style>
