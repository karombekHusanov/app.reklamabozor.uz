<script setup lang="ts">
import { BadgeCheck, ImageIcon, MapPin, MessageCircle, Star, Store } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import Avatar from '@/core/ui/Avatar.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { ROUTES } from '@/modules/shell/constants/routes'
import { fetchPublicAgent, type PublicAgent } from '@/modules/marketplace/services/agents.service'

const props = defineProps<{ id: string }>()

const router = useRouter()
const locale = useLocaleStore()
const { haptic } = useTelegram()

const agent = ref<PublicAgent | null>(null)
const loading = ref(true)

// Placeholder metrics — no backend yet.
const RATING = '4.7'
const COMPLETED_ORDERS = 352

const primaryCategory = computed(() =>
  agent.value?.categories[0] ? categoryName(agent.value.categories[0], locale.locale) : null,
)

const headerTitle = computed(() => primaryCategory.value ?? agent.value?.company_name ?? locale.t.marketplace.title)

onMounted(async () => {
  try {
    agent.value = await fetchPublicAgent(Number(props.id))
  }
  catch {
    agent.value = null
  }
  finally {
    loading.value = false
  }
})

function openChat() {
  haptic('light')
  router.push(ROUTES.chat)
}
</script>

<template>
  <div>
    <AppHeader :title="headerTitle" show-back />

    <section class="space-y-5 px-5">
      <template v-if="loading">
        <Skeleton class="h-8 w-32 rounded-full" />
        <Skeleton class="h-20 w-full rounded-3xl" />
        <Skeleton class="h-48 w-full rounded-3xl" />
      </template>

      <template v-else-if="agent">
        <!-- Category chip -->
        <span v-if="primaryCategory" class="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
          {{ primaryCategory }}
        </span>

        <!-- Agent identity (on the blue background) -->
        <div class="flex items-start gap-3 text-white">
          <Avatar :src="agent.company_logo" :name="agent.company_name" size="xl" class="rounded-full" />
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <h2 class="text-xl font-bold leading-tight">
                {{ agent.company_name }}
              </h2>
              <button
                type="button"
                class="shrink-0 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold text-amber-950"
              >
                {{ locale.t.marketplace.reviews }}:
              </button>
            </div>
            <div class="mt-1 flex items-center gap-2">
              <BadgeCheck class="size-5 shrink-0 fill-white text-primary" />
              <span class="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-950">
                <Star class="size-3 fill-amber-950" />
                {{ RATING }}
              </span>
            </div>
            <p v-if="agent.location_label" class="mt-1.5 flex items-start gap-1 text-sm text-white/75">
              <MapPin class="mt-0.5 size-3.5 shrink-0" />
              {{ agent.location_label }}
            </p>
            <p class="mt-0.5 text-xs text-white/60">
              {{ locale.t.marketplace.completedOrders }}: {{ COMPLETED_ORDERS }} {{ locale.t.home.unit }}
            </p>
          </div>
        </div>

        <!-- Bio -->
        <p v-if="agent.bio" class="text-sm leading-relaxed text-white/80">
          {{ agent.bio }}
        </p>

        <!-- Featured portfolio (placeholder — no images backend yet) -->
        <div class="flex aspect-[16/10] items-center justify-center rounded-3xl bg-gradient-to-br from-white to-sky-100 shadow-[0_4px_16px_rgba(2,48,92,0.12)]">
          <ImageIcon class="size-10 text-sky-300" />
        </div>

        <!-- Gallery grid (placeholder) -->
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="n in 4"
            :key="n"
            class="flex aspect-square items-center justify-center rounded-3xl bg-gradient-to-br from-white to-sky-100 shadow-[0_4px_16px_rgba(2,48,92,0.10)]"
          >
            <ImageIcon class="size-7 text-sky-200" />
          </div>
        </div>

        <!-- Chat CTA -->
        <button
          type="button"
          class="btn-brand flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold"
          @click="openChat"
        >
          <MessageCircle class="size-5" />
          {{ locale.t.marketplace.chatWithCompany }}
        </button>
      </template>

      <GlassCard v-else padding="none" class="overflow-hidden">
        <EmptyState
          :icon="Store"
          :title="locale.t.marketplace.emptyTitle"
          :description="locale.t.marketplace.emptyApproved"
        />
      </GlassCard>
    </section>
  </div>
</template>
