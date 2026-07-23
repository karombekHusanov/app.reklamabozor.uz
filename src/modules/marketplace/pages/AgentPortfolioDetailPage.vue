<script setup lang="ts">
import { ArrowUpRight, FileText, ImageOff, Paperclip } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { openExternalLink } from '@/core/lib/telegram-init'
import { fetchPublicAgent, type PublicAgent } from '@/modules/marketplace/services/agents.service'
import type { PortfolioFile, PortfolioItem } from '@/modules/agent/types/agent'

const props = defineProps<{ id: string, itemId: string }>()

const locale = useLocaleStore()
const { haptic } = useTelegram()

const agent = ref<PublicAgent | null>(null)
const loading = ref(true)
const activeIndex = ref(0)

const item = computed<PortfolioItem | null>(() => {
  const found = agent.value?.portfolio?.find(p => p.id === Number(props.itemId))
  return found ?? null
})

const images = computed(() => {
  if (!item.value) return []
  if (item.value.images.length > 0) return item.value.images
  if (item.value.image) {
    return [{ id: -1, url: item.value.image, original_name: item.value.title, mime_type: 'image/*', size: 0 }]
  }
  return []
})

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

function onScroll(event: Event) {
  const el = event.target as HTMLElement
  if (!el.clientWidth) return
  activeIndex.value = Math.round(el.scrollLeft / el.clientWidth)
}

function openLink() {
  if (!item.value?.link_url) return
  haptic('light')
  openExternalLink(item.value.link_url)
}

function openAttachment(file: PortfolioFile) {
  haptic('light')
  openExternalLink(file.url)
}

function formatSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="agent-profile-page pb-8">
    <AppHeader
      :title="item?.title || locale.t.profile.agentPortfolioTitle"
      show-back
    />

    <section
      v-if="loading"
      class="space-y-4 px-4 pt-3"
    >
      <Skeleton class="aspect-[4/3] w-full rounded-3xl" />
      <Skeleton class="h-6 w-2/3 rounded-full" />
      <Skeleton class="h-24 w-full rounded-2xl" />
    </section>

    <section
      v-else-if="item"
      class="space-y-4 px-4 pt-3"
    >
      <!-- Gallery -->
      <div
        v-if="images.length"
        class="portfolio-detail-gallery"
      >
        <div
          class="portfolio-detail-gallery__track"
          @scroll.passive="onScroll"
        >
          <div
            v-for="img in images"
            :key="img.id"
            class="portfolio-detail-gallery__slide"
          >
            <img
              :src="img.url"
              :alt="item.title"
              class="portfolio-detail-gallery__image"
            >
          </div>
        </div>

        <span
          v-if="images.length > 1"
          class="portfolio-detail-gallery__counter"
        >
          {{ locale.t.profile.agentPortfolioDetailCounter
            .replace('{i}', String(activeIndex + 1))
            .replace('{n}', String(images.length)) }}
        </span>

        <div
          v-if="images.length > 1"
          class="portfolio-detail-gallery__dots"
        >
          <span
            v-for="(img, i) in images"
            :key="img.id"
            class="portfolio-detail-gallery__dot"
            :class="{ 'portfolio-detail-gallery__dot--active': i === activeIndex }"
          />
        </div>
      </div>

      <div
        v-else
        class="flex aspect-[4/3] items-center justify-center rounded-3xl border border-border bg-muted/15 text-muted-foreground"
      >
        <ImageOff class="size-8" />
      </div>

      <!-- Title -->
      <div>
        <h1 class="text-lg font-extrabold leading-tight tracking-tight text-foreground">
          {{ item.title }}
        </h1>
      </div>

      <!-- Description -->
      <div
        v-if="item.description"
        class="agent-profile-section"
      >
        <div class="agent-profile-section__header">
          <h3 class="agent-profile-section__title">
            {{ locale.t.profile.agentPortfolioDetailAbout }}
          </h3>
        </div>
        <div class="agent-profile-section__body">
          <p class="whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
            {{ item.description }}
          </p>
        </div>
      </div>

      <!-- Attachments -->
      <div
        v-if="item.attachments.length"
        class="agent-profile-section"
      >
        <div class="agent-profile-section__header">
          <h3 class="agent-profile-section__title">
            {{ locale.t.profile.agentPortfolioDetailFiles }}
          </h3>
        </div>
        <div class="agent-profile-section__body space-y-2">
          <button
            v-for="file in item.attachments"
            :key="file.id"
            type="button"
            class="portfolio-detail-file pressable"
            @click="openAttachment(file)"
          >
            <span class="portfolio-detail-file__icon">
              <FileText class="size-4" />
            </span>
            <span class="min-w-0 flex-1 text-left">
              <span class="portfolio-detail-file__name">{{ file.original_name }}</span>
              <span
                v-if="formatSize(file.size)"
                class="portfolio-detail-file__size"
              >{{ formatSize(file.size) }}</span>
            </span>
            <ArrowUpRight class="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </div>

      <!-- External link CTA -->
      <button
        v-if="item.link_url"
        type="button"
        class="portfolio-detail-link pressable"
        @click="openLink"
      >
        <Paperclip class="size-4 shrink-0" />
        <span class="truncate">{{ locale.t.profile.agentPortfolioDetailOpenLink }}</span>
        <ArrowUpRight class="size-4 shrink-0" />
      </button>
    </section>

    <section
      v-else
      class="px-4 pt-3"
    >
      <GlassCard
        padding="none"
        class="overflow-hidden"
      >
        <EmptyState
          :icon="ImageOff"
          :title="locale.t.profile.agentPortfolioDetailNotFound"
          :description="locale.t.profile.agentPortfolioDetailNotFoundHint"
        />
      </GlassCard>
    </section>
  </div>
</template>
