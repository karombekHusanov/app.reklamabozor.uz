<script setup lang="ts">
import { useLocaleStore } from '@/core/i18n/locale.store'

defineProps<{
  percent: number
}>()

const locale = useLocaleStore()
</script>

<template>
  <div class="profile-edit-completion">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm font-semibold text-foreground">
        {{ locale.t.agent.profileCompleteness }}
      </p>
      <span class="profile-edit-completion__value">{{ percent }}%</span>
    </div>
    <div class="profile-edit-completion__track">
      <div
        class="profile-edit-completion__fill"
        :style="{ width: `${percent}%` }"
      />
    </div>
  </div>
</template>
