<script setup lang="ts">
import { Bell } from '@lucide/vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { formatDateTime } from '@/core/lib/date'
import { useNotificationsStore, type AppNotification } from '@/modules/notifications/stores/notifications.store'

const locale = useLocaleStore()
const router = useRouter()
const notifications = useNotificationsStore()

onMounted(() => {
  void notifications.load()
})

function open(item: AppNotification) {
  if (item.link_url) router.push(item.link_url)
}
</script>

<template>
  <div>
    <AppHeader
      :title="locale.t.notifications.title"
      :subtitle="locale.t.notifications.subtitle"
      show-back
    />

    <section class="space-y-3 px-[18px]">
      <template v-if="notifications.isLoading && !notifications.hasLoaded">
        <div
          v-for="n in 4"
          :key="n"
          class="rb-card flex items-start gap-3 p-4"
        >
          <Skeleton class="size-11 shrink-0 rounded-[var(--rb-r-icon)]" />
          <div class="min-w-0 flex-1 space-y-2">
            <Skeleton class="h-4 w-3/5 rounded-md" />
            <Skeleton class="h-3 w-full rounded-md" />
            <Skeleton class="h-3 w-1/3 rounded-md" />
          </div>
        </div>
      </template>

      <div
        v-else-if="notifications.items.length === 0"
        class="rb-card overflow-hidden"
      >
        <EmptyState
          :icon="Bell"
          :title="locale.t.notifications.emptyTitle"
          :description="locale.t.notifications.emptyBody"
        />
      </div>

      <template v-else>
        <component
          :is="item.link_url ? 'button' : 'div'"
          v-for="item in notifications.items"
          :key="item.id"
          type="button"
          class="rb-card flex w-full items-start gap-3 p-4 text-left"
          :class="[
            item.link_url ? 'rb-card--interactive' : '',
            !item.read_at ? 'rb-card--unread' : '',
          ]"
          @click="open(item)"
        >
          <span class="rb-icon-tile relative">
            <Bell class="size-[19px]" />
            <span
              v-if="!item.read_at"
              class="notif-dot"
              aria-hidden="true"
            />
          </span>
          <div class="min-w-0 flex-1">
            <p class="rb-font-display text-[15px] font-extrabold leading-tight tracking-[-0.01em] text-foreground">
              {{ item.title }}
            </p>
            <p class="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {{ item.body }}
            </p>
            <p class="mt-1.5 text-[11px] font-medium tabular-nums text-muted-foreground/80">
              {{ formatDateTime(item.created_at) }}
            </p>
          </div>
        </component>
      </template>
    </section>
  </div>
</template>

<style scoped>
.rb-card--unread { border-color: color-mix(in srgb, var(--primary) 35%, var(--border)); }
.notif-dot {
  position: absolute; top: -3px; right: -3px; width: 12px; height: 12px;
  border-radius: 999px; background: var(--rb-cta); border: 2.5px solid var(--card);
}
</style>
