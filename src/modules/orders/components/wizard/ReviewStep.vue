<script setup lang="ts">
import { computed, inject } from 'vue'
import { categoryName } from '@/core/i18n/category-name'
import { regionName } from '@/core/i18n/region-name'
import { formatDate } from '@/core/lib/date'
import { useLocaleStore } from '@/core/i18n/locale.store'
import GlassCard from '@/core/ui/GlassCard.vue'
import { WIZARD_KEY } from '@/modules/orders/components/wizard/context'

const locale = useLocaleStore()
const ctx = inject(WIZARD_KEY)!

const notSet = computed(() => locale.t.common.notAdded)

const serviceLabel = computed(() => {
  const c = ctx.categories.find(cat => cat.id === ctx.draft.category_id)
  return c ? categoryName(c, locale.locale) : notSet.value
})

const deadlineLabel = computed(() =>
  ctx.draft.deadline_date ? formatDate(ctx.draft.deadline_date) : notSet.value,
)

const regionLabel = computed(() => {
  if (ctx.draft.region_id == null) return locale.t.orders.wizard.allUzbekistan
  const region = ctx.regions.find(r => r.id === ctx.draft.region_id)
  if (!region) return locale.t.orders.wizard.allUzbekistan
  const base = regionName(region, locale.locale)
  if (ctx.draft.district_id == null) return base
  const district = region.districts.find(d => d.id === ctx.draft.district_id)
  return district ? `${regionName(district, locale.locale)}, ${base}` : base
})

const locationLabel = computed(() =>
  ctx.draft.location_label.trim() || notSet.value,
)

const rows = computed(() => [
  { label: locale.t.orders.wizard.rowService, value: serviceLabel.value },
  { label: locale.t.orders.wizard.rowProjectName, value: ctx.draft.title.trim() || notSet.value },
  {
    label: locale.t.orders.wizard.rowHashtags,
    value: ctx.draft.hashtags.length
      ? ctx.draft.hashtags.map(t => `#${t}`).join(' ')
      : notSet.value,
  },
  { label: locale.t.orders.wizard.rowDeadline, value: deadlineLabel.value },
  { label: locale.t.orders.wizard.rowRegion, value: regionLabel.value },
  { label: locale.t.orders.wizard.rowLocation, value: locationLabel.value },
  {
    label: locale.t.orders.wizard.rowFiles,
    value: `${ctx.draft.files.length} ${locale.t.orders.wizard.filesCountSuffix}`,
  },
])
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <h2 class="text-lg font-bold text-foreground">
        {{ locale.t.orders.wizard.reviewTitle }}
      </h2>
      <p class="text-sm text-muted-foreground">
        {{ locale.t.orders.wizard.reviewSubtitle }}
      </p>
    </div>

    <GlassCard
      padding="none"
      class="divide-y divide-border"
    >
      <div
        v-for="row in rows"
        :key="row.label"
        class="flex items-start justify-between gap-4 px-4 py-3"
      >
        <span class="shrink-0 text-sm text-muted-foreground">{{ row.label }}</span>
        <span class="text-right text-sm font-medium text-foreground">{{ row.value }}</span>
      </div>
    </GlassCard>
  </div>
</template>
