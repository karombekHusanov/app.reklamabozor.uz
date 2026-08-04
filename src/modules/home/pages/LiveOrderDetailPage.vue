<script setup lang="ts">
import { Calendar, Download, Eye, FileText, MessageSquareQuote, Send, User } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import Avatar from '@/core/ui/Avatar.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import Badge from '@/core/ui/Badge.vue'
import { Button } from '@/core/ui/button'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { formatDate } from '@/core/lib/date'
import { getApiErrorMessage } from '@/core/api/api-error'
import { ROUTES } from '@/modules/shell/constants/routes'
import OrderStatusBadge from '@/modules/orders/components/OrderStatusBadge.vue'
import { formatPrice, offerStatusVariant } from '@/modules/orders/lib/order-status'
import { submitOffer } from '@/modules/orders/services/orders.service'
import { fetchShowcaseOrder, type ShowcaseOrder } from '@/modules/home/services/live-orders.service'
import OfferFormDrawer from '@/modules/home/components/OfferFormDrawer.vue'
import type { OrderStatus } from '@/modules/orders/types/order'

const props = defineProps<{ id: string }>()

const locale = useLocaleStore()
const router = useRouter()
const toast = useToast()

const order = ref<ShowcaseOrder | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const submitting = ref(false)
const offerDrawerOpen = ref(false)
const offerFormRef = ref<InstanceType<typeof OfferFormDrawer> | null>(null)

const title = computed(() => {
  if (!order.value) return ''
  return order.value.category
    ? categoryName(order.value.category, locale.locale)
    : order.value.title
})

function isImageAttachment(file: { mime_type: string | null }): boolean {
  return (file.mime_type ?? '').startsWith('image/')
}

function attachmentType(file: { original_name: string, mime_type: string | null }): string {
  const ext = /\.([a-z0-9]{1,6})$/i.exec(file.original_name ?? '')?.[1]
  if (ext) return ext.toUpperCase()
  const sub = (file.mime_type ?? '').split('/')[1] ?? ''
  if (sub.includes('pdf')) return 'PDF'
  if (sub.includes('word')) return 'DOC'
  if (sub.includes('sheet') || sub.includes('excel')) return 'XLS'
  if (sub.includes('presentation')) return 'PPT'
  if (sub.includes('zip') || sub.includes('rar') || sub.includes('compressed')) return 'ZIP'
  return sub && sub.length <= 4 ? sub.toUpperCase() : ''
}

function formatFileSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function loadOrder() {
  loading.value = true
  error.value = null
  try {
    order.value = await fetchShowcaseOrder(Number(props.id))
  }
  catch (e) {
    error.value = getApiErrorMessage(e)
  }
  finally {
    loading.value = false
  }
}

async function handleSubmitOffer(price: number, comment: string) {
  if (!order.value || submitting.value) return
  submitting.value = true
  try {
    await submitOffer(order.value.id, { price, comment })
    toast.success(locale.t.orders.showcase.offerSent)
    offerDrawerOpen.value = false
    offerFormRef.value?.reset()
    await loadOrder()
  }
  catch (e) {
    toast.error(getApiErrorMessage(e) || locale.t.orders.showcase.offerError)
  }
  finally {
    submitting.value = false
  }
}

function openClient(clientId: number) {
  router.push(ROUTES.clientDetail(clientId))
}

onMounted(loadOrder)
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="locale.t.orders.showcase.detailTitle"
      :subtitle="locale.t.orders.showcase.detailSubtitle"
      show-back
    />

    <section class="space-y-4 px-5">
      <!-- Loading -->
      <template v-if="loading && !order">
        <Skeleton class="h-40 w-full rounded-3xl" />
        <Skeleton class="h-32 w-full rounded-3xl" />
      </template>

      <template v-else-if="order">
        <!-- Summary card -->
        <GlassCard class="space-y-4">
          <div class="min-w-0">
            <OrderStatusBadge
              :status="(order.status as OrderStatus)"
              class="mb-2"
            />
            <h2 class="text-lg font-semibold leading-tight text-foreground">
              {{ title }}
            </h2>
            <p class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span class="rounded-md bg-muted px-1.5 py-0.5 font-semibold tabular-nums text-foreground/70 dark:bg-white/10">
                #{{ order.id }}
              </span>
              <span aria-hidden="true">·</span>
              {{ formatDate(order.created_at, locale.locale) }}
            </p>
          </div>

          <p
            v-if="order.description"
            class="text-sm leading-relaxed text-muted-foreground"
          >
            {{ order.description }}
          </p>

          <!-- Deadline -->
          <div
            v-if="order.deadline"
            class="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Calendar class="size-3.5" />
            <span class="font-medium">{{ locale.t.orders.showcase.deadline }}:</span>
            {{ order.deadline }}
          </div>

          <!-- Stats -->
          <div class="flex items-center gap-4 text-xs text-muted-foreground">
            <span class="inline-flex items-center gap-1.5">
              <Eye class="size-3.5" />
              {{ order.views_count ?? 0 }} {{ locale.t.orders.viewsSuffix }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <MessageSquareQuote class="size-3.5" />
              {{ order.offers_count ?? 0 }} {{ locale.t.orders.offersSuffix }}
            </span>
          </div>

          <!-- Attachments (mirrors OrderDetailPage pattern) -->
          <div
            v-if="order.attachment_files.length > 0"
            class="space-y-2"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {{ locale.t.orders.attachedFiles }}
            </p>
            <div class="flex flex-wrap gap-2">
              <a
                v-for="file in order.attachment_files"
                :key="file.id"
                :href="file.url"
                target="_blank"
                rel="noopener"
                :download="file.original_name"
                class="group flex items-center gap-2.5 rounded-2xl border border-dashed border-border bg-card/40 px-3 py-2.5 transition active:scale-[0.98] dark:bg-white/5"
              >
                <span class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                  <img
                    v-if="isImageAttachment(file)"
                    :src="file.url"
                    alt=""
                    class="size-full object-cover"
                    loading="lazy"
                  >
                  <FileText v-else class="size-5" />
                </span>
                <span class="flex min-w-0 flex-col leading-tight">
                  <span
                    v-if="attachmentType(file)"
                    class="text-xs font-bold text-foreground"
                  >
                    {{ attachmentType(file) }}
                  </span>
                  <span
                    v-if="formatFileSize(file.size)"
                    class="text-[11px] text-muted-foreground"
                  >
                    {{ formatFileSize(file.size) }}
                  </span>
                </span>
                <Download class="size-4 shrink-0 text-muted-foreground transition group-active:text-primary" />
              </a>
            </div>
          </div>
        </GlassCard>

        <!-- Owner / client section -->
        <GlassCard
          v-if="order.client"
          class="space-y-2"
        >
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {{ locale.t.orders.showcase.owner }}
          </p>
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl p-1 text-left transition active:opacity-80"
            @click="openClient(order.client!.id)"
          >
            <Avatar
              :src="order.client.avatar"
              :name="order.client.first_name ?? undefined"
              size="md"
              class="rounded-full"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold text-foreground">
                {{ order.client.first_name }}
              </span>
              <span class="block text-xs text-muted-foreground">
                <User class="mr-0.5 inline size-3" />
                {{ locale.t.orders.showcase.owner }}
              </span>
            </span>
          </button>
        </GlassCard>

        <!-- Existing offer (my_offer) — read-only card -->
        <GlassCard
          v-if="order.my_offer"
          class="space-y-3"
        >
          <div class="flex items-center gap-2">
            <Send class="size-4 text-primary" />
            <h3 class="text-sm font-semibold text-foreground">
              {{ locale.t.orders.showcase.yourOffer }}
            </h3>
            <Badge
              :variant="offerStatusVariant(order.my_offer.status)"
              class="ml-auto"
            >
              {{ locale.t.orders.offerStatus[order.my_offer.status] }}
            </Badge>
          </div>
          <div class="space-y-1.5 rounded-2xl border border-border bg-muted/30 p-3 dark:bg-white/5">
            <p class="text-sm font-bold text-foreground">
              {{ formatPrice(order.my_offer.price) }}
            </p>
            <p class="text-xs leading-relaxed text-muted-foreground">
              {{ order.my_offer.comment }}
            </p>
          </div>
        </GlassCard>

        <!-- Offer CTA — only if can_offer is true and no existing offer -->
        <Button
          v-if="order.can_offer && !order.my_offer"
          class="h-12 w-full rounded-2xl text-base"
          @click="offerDrawerOpen = true"
        >
          <Send class="size-4" />
          {{ locale.t.orders.showcase.makeOffer }}
        </Button>

        <!-- Error -->
        <p
          v-if="error"
          class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {{ error }}
        </p>
      </template>

      <!-- Not found -->
      <GlassCard
        v-else
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="MessageSquareQuote"
          :title="locale.t.orders.notFoundTitle"
          :description="locale.t.orders.notFoundBody"
        />
      </GlassCard>
    </section>

    <!-- Offer form drawer -->
    <OfferFormDrawer
      v-if="order"
      ref="offerFormRef"
      v-model:open="offerDrawerOpen"
      :order-id="order.id"
      :submitting="submitting"
      @submit="handleSubmitOffer"
    />
  </div>
</template>
