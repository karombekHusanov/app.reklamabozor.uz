<script setup lang="ts">
import { Check } from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { advantageIcon } from '@/modules/profile/lib/advantage-icons'
import type { Advantage } from '@/modules/agent/types/agent'

const MAX_PICKS = 6

const props = defineProps<{
  modelValue: number[]
  catalog: Advantage[]
  /** Hide the built-in title when a parent section already provides one. */
  embedded?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const locale = useLocaleStore()

const atCap = computed(() => props.modelValue.length >= MAX_PICKS)

function name(advantage: Advantage): string {
  return locale.locale === 'ru' ? advantage.name_ru : advantage.name_uz
}

function isPicked(id: number): boolean {
  return props.modelValue.includes(id)
}

function toggle(id: number) {
  if (isPicked(id)) {
    emit('update:modelValue', props.modelValue.filter(v => v !== id))
    return
  }
  if (atCap.value) return
  emit('update:modelValue', [...props.modelValue, id])
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="!embedded"
      class="flex items-baseline justify-between"
    >
      <p class="text-sm font-semibold">
        {{ locale.t.profile.editAdvantagesTitle }}
      </p>
      <span class="text-xs text-muted-foreground">{{ modelValue.length }}/{{ MAX_PICKS }}</span>
    </div>

    <div class="profile-category-list">
      <label
        v-for="advantage in catalog"
        :key="advantage.id"
        class="profile-category-row pressable"
        :class="[
          isPicked(advantage.id) && 'profile-category-row--selected',
          !isPicked(advantage.id) && atCap && 'profile-category-row--disabled',
        ]"
      >
        <span class="profile-category-row__content">
          <component
            :is="advantageIcon(advantage.icon)"
            class="profile-category-row__icon"
            :class="isPicked(advantage.id) ? 'text-primary' : 'text-muted-foreground'"
          />
          <span class="profile-category-row__label">
            {{ name(advantage) }}
          </span>
        </span>

        <span
          class="profile-category-row__checkbox"
          aria-hidden="true"
        >
          <Check
            v-if="isPicked(advantage.id)"
            class="size-3.5"
          />
        </span>

        <input
          type="checkbox"
          class="sr-only"
          :checked="isPicked(advantage.id)"
          :disabled="!isPicked(advantage.id) && atCap"
          @change="toggle(advantage.id)"
        >
      </label>
    </div>
  </div>
</template>
