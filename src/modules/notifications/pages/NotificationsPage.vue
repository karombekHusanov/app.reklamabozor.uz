<script setup lang="ts">
import { Bell } from '@lucide/vue'
import { onMounted } from 'vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useNotificationsStore } from '@/modules/notifications/stores/notifications.store'

const locale = useLocaleStore()
const notifications = useNotificationsStore()

onMounted(() => {
  void notifications.load()
})
</script>

<template>
  <div>
    <AppHeader
      :title="locale.t.notifications.title"
      :subtitle="locale.t.notifications.subtitle"
      show-back
    />

    <section class="px-5">
      <GlassCard v-if="notifications.isLoading && !notifications.hasLoaded" padding="none" class="overflow-hidden">
        <div class="space-y-0 divide-y divide-border/70">
          <div v-for="n in 4" :key="n" class="flex items-start gap-3 px-4 py-4">
            <Skeleton class="size-10 shrink-0 rounded-2xl" />
            <div class="min-w-0 flex-1 space-y-2">
              <Skeleton class="h-4 w-3/5 rounded-md" />
              <Skeleton class="h-3 w-full rounded-md" />
              <Skeleton class="h-3 w-1/3 rounded-md" />
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard v-else-if="notifications.items.length === 0" padding="none" class="overflow-hidden">
        <EmptyState
          :icon="Bell"
          :title="locale.t.notifications.emptyTitle"
          :description="locale.t.notifications.emptyBody"
        />
      </GlassCard>

      <GlassCard v-else padding="none" class="overflow-hidden">
        <ul class="divide-y divide-border/70">
          <li
            v-for="item in notifications.items"
            :key="item.id"
            class="px-4 py-4"
          >
            <p class="font-semibold text-foreground">
              {{ item.title }}
            </p>
            <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
              {{ item.body }}
            </p>
          </li>
        </ul>
      </GlassCard>
    </section>
  </div>
</template>
