<script setup lang="ts">
import { CircleCheck, CircleDashed, MapPin } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '@/core/ui/GlassCard.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import { workReadiness, workReadinessEditPath } from '@/modules/agent/lib/work-readiness'

// An approved executor can't respond to requests until the profile has its
// service categories and a map location. Shows what is still missing and
// jumps to it; hidden once ready (or before approval). `hideCta` on the edit
// page itself, where the tabs are right below.
withDefaults(defineProps<{ hideCta?: boolean }>(), { hideCta: false })

const agent = useAgentStore()
const locale = useLocaleStore()
const router = useRouter()
const { haptic } = useTelegram()

const readiness = computed(() => workReadiness(agent.profile))

const items = computed(() => [
  { key: 'categories', label: locale.t.executor.readyCategories, done: !readiness.value.missingCategories },
  { key: 'location', label: locale.t.executor.readyLocation, done: !readiness.value.missingLocation },
])

onMounted(() => {
  void agent.loadProfile()
})

function complete() {
  haptic('light')
  void router.push(workReadinessEditPath(readiness.value))
}
</script>

<template>
  <GlassCard
    v-if="readiness.blocked"
    class="space-y-3 border border-amber-500/30"
    role="status"
  >
    <div class="flex items-start gap-3">
      <div class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600">
        <MapPin class="size-5" />
      </div>
      <div class="min-w-0">
        <p class="text-sm font-semibold text-foreground">
          {{ locale.t.executor.readyTitle }}
        </p>
        <p class="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {{ locale.t.executor.readyBody }}
        </p>
      </div>
    </div>

    <ul class="space-y-1.5">
      <li
        v-for="item in items"
        :key="item.key"
        class="flex items-center gap-2 text-sm"
        :class="item.done ? 'text-muted-foreground' : 'font-medium text-foreground'"
      >
        <CircleCheck
          v-if="item.done"
          class="size-4 shrink-0 text-emerald-600"
        />
        <CircleDashed
          v-else
          class="size-4 shrink-0 text-amber-600"
        />
        {{ item.label }}
      </li>
    </ul>

    <Button
      v-if="!hideCta"
      type="button"
      class="h-11 w-full rounded-2xl"
      @click="complete"
    >
      {{ locale.t.executor.readyCta }}
    </Button>
  </GlassCard>
</template>
