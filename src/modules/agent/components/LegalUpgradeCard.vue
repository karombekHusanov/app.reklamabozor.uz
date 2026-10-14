<script setup lang="ts">
import { Building2, CircleX, Clock } from '@lucide/vue'
import { computed } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { AgentProfile } from '@/modules/agent/types/agent'

// Approved individual executor → legal-entity track (Tender access). Shows the
// CTA, the pending state, or the last rejection with its reason. Hidden for
// legal entities and not-yet-approved applications.
const props = defineProps<{
  profile: AgentProfile
}>()

const emit = defineEmits<{
  start: []
}>()

const locale = useLocaleStore()

const latest = computed(() => props.profile.upgrade?.latest ?? null)
const isPending = computed(() => latest.value?.status === 'pending')
const isRejected = computed(() => latest.value?.status === 'rejected')
const show = computed(() =>
  props.profile.provider_type === 'individual' && props.profile.status === 'approved',
)
</script>

<template>
  <GlassCard
    v-if="show"
    class="space-y-3"
  >
    <div class="flex items-start gap-3">
      <div
        class="flex size-10 shrink-0 items-center justify-center rounded-2xl"
        :class="isRejected ? 'bg-red-500/12 text-red-600' : 'bg-primary/12 text-primary'"
      >
        <Clock
          v-if="isPending"
          class="size-5"
        />
        <CircleX
          v-else-if="isRejected"
          class="size-5"
        />
        <Building2
          v-else
          class="size-5"
        />
      </div>
      <div class="min-w-0">
        <p class="text-sm font-semibold text-foreground">
          {{ isPending ? locale.t.executor.upgradePendingTitle : locale.t.executor.upgradeTitle }}
        </p>
        <p class="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {{ isPending ? locale.t.executor.upgradePendingBody : locale.t.executor.upgradeBody }}
        </p>
      </div>
    </div>

    <div
      v-if="isRejected && latest?.rejection_reason"
      class="rounded-2xl bg-red-500/10 px-4 py-3 text-xs text-red-700"
    >
      <p class="font-medium">
        {{ locale.t.executor.upgradeRejected }}
      </p>
      <p class="mt-1">
        {{ latest.rejection_reason }}
      </p>
    </div>

    <Button
      v-if="profile.upgrade?.can_request"
      type="button"
      class="h-11 w-full rounded-2xl"
      @click="emit('start')"
    >
      {{ isRejected ? locale.t.executor.upgradeRetry : locale.t.executor.upgradeCta }}
    </Button>
  </GlassCard>
</template>
