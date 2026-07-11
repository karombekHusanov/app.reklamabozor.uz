<script setup lang="ts">
import { Moon, Smartphone, Sun } from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'
import { useThemeStore, type ThemeMode } from '@/core/stores/theme.store'

const locale = useLocaleStore()
const theme = useThemeStore()
const { haptic } = useTelegram()

const options = computed(() => [
  {
    value: 'light' as ThemeMode,
    label: locale.t.profile.settingsThemeLight,
    icon: Sun,
  },
  {
    value: 'auto' as ThemeMode,
    label: locale.t.profile.settingsThemeAuto,
    icon: Smartphone,
  },
  {
    value: 'dark' as ThemeMode,
    label: locale.t.profile.settingsThemeDark,
    icon: Moon,
  },
])

function pick(value: ThemeMode) {
  if (theme.mode === value) return
  haptic('light')
  theme.setMode(value)
}
</script>

<template>
  <div
    class="theme-switcher"
    role="radiogroup"
    :aria-label="locale.t.profile.settingsThemeSection"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      class="theme-switcher__card pressable"
      :class="{ 'theme-switcher__card--active': theme.mode === option.value }"
      :aria-checked="theme.mode === option.value"
      @click="pick(option.value)"
    >
      <div
        class="theme-switcher__preview"
        :class="`theme-switcher__preview--${option.value}`"
        aria-hidden="true"
      >
        <div class="theme-switcher__preview-orbit" />
        <div class="theme-switcher__preview-surface">
          <span class="theme-switcher__preview-chip" />
          <span class="theme-switcher__preview-line" />
          <span class="theme-switcher__preview-line theme-switcher__preview-line--short" />
        </div>
      </div>

      <div class="theme-switcher__meta">
        <span class="theme-switcher__icon">
          <component :is="option.icon" class="size-3.5" />
        </span>
        <span class="theme-switcher__label">{{ option.label }}</span>
      </div>
    </button>
  </div>
</template>
