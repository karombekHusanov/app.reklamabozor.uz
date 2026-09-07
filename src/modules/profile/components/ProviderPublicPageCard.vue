<script setup lang="ts">
import { computed } from 'vue'
import { Eye } from '@lucide/vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { AgentProfile } from '@/modules/agent/types/agent'

const props = defineProps<{
  profile: AgentProfile
  /** Public marketplace page, when the profile is approved. */
  publicPath: string | null
}>()

const emit = defineEmits<{ navigate: [to: string] }>()

const locale = useLocaleStore()
const { haptic } = useTelegram()

const percent = computed(() => props.profile.completion_percent ?? 0)

/** What the client-facing page is still missing, named exactly. */
const missing = computed(() => {
  const t = locale.t.profile
  const items: string[] = []

  if (!props.profile.company_logo) items.push(t.missingLogo)
  if (!props.profile.bio) items.push(t.missingBio)
  if (!props.profile.categories.length) items.push(t.missingCategories)
  if (!props.profile.portfolio.length) items.push(t.missingPortfolio)
  if (!props.profile.results_text) items.push(t.missingResults)
  if (!props.profile.location_label) items.push(t.missingLocation)

  return items
})

function go(to: string) {
  haptic('light')
  emit('navigate', to)
}
</script>

<template>
  <GlassCard class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <p class="profile-eyebrow">
        {{ locale.t.profile.publicPageTitle }}
      </p>
      <span class="rb-font-display text-[15px] font-extrabold tabular-nums text-primary">{{ percent }}%</span>
    </div>

    <div class="h-1.5 overflow-hidden rounded-full bg-muted">
      <span
        class="block h-full rounded-full bg-primary transition-[width] duration-500"
        :style="{ width: `${percent}%` }"
      />
    </div>

    <p class="text-[12.5px] leading-snug text-muted-foreground">
      {{ missing.length ? locale.t.profile.publicPageHint : locale.t.profile.publicPageComplete }}
    </p>

    <div
      v-if="missing.length"
      class="flex flex-wrap gap-2"
    >
      <span
        v-for="item in missing"
        :key="item"
        class="inline-flex h-7 items-center rounded-full border border-dashed border-border px-3 text-[12px] font-semibold text-muted-foreground"
      >{{ item }}</span>
    </div>

    <div class="flex gap-2">
      <button
        v-if="missing.length"
        type="button"
        class="pressable h-10 flex-1 rounded-2xl bg-secondary text-[13.5px] font-bold text-secondary-foreground transition active:scale-[0.98]"
        @click="go(ROUTES.profileEdit)"
      >
        {{ locale.t.profile.publicPageFill }}
      </button>
      <button
        v-if="publicPath"
        type="button"
        class="pressable flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[13.5px] font-semibold text-foreground transition active:scale-[0.98]"
        @click="go(publicPath)"
      >
        <Eye class="size-4" />
        {{ locale.t.profile.publicPageView }}
      </button>
    </div>
  </GlassCard>
</template>
