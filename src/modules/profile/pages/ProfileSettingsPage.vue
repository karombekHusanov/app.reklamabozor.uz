<script setup lang="ts">
import { Check, ChevronRight, Languages, UserRound } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { LOCALES, type Locale } from '@/core/i18n/messages'
import { useTelegram } from '@/core/composables/useTelegram'
import { ROUTES } from '@/modules/shell/constants/routes'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import ThemeSwitcher from '@/modules/profile/components/ThemeSwitcher.vue'

const auth = useAuthStore()
const locale = useLocaleStore()
const router = useRouter()
const { haptic } = useTelegram()

function pickLanguage(value: Locale) {
  if (locale.locale === value) return
  haptic('light')
  locale.setLocale(value)
}

function navigate(to: string) {
  haptic('light')
  void router.push(to)
}
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="locale.t.profile.settingsTitle"
      :subtitle="locale.t.profile.settingsSubtitle"
      show-back
    />

    <section class="space-y-4 px-4">
      <GlassCard
        v-if="auth.isAuthenticated"
        padding="none"
        class="overflow-hidden"
      >
        <button
          type="button"
          class="profile-settings-action pressable"
          @click="navigate(ROUTES.profileEdit)"
        >
          <span class="profile-settings-row__icon profile-settings-row__icon--sky">
            <UserRound class="size-3.5" />
          </span>
          <span class="min-w-0 flex-1 text-left text-[13px] font-semibold text-foreground">
            {{ locale.t.profile.settingsEditProfile }}
          </span>
          <ChevronRight class="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
        </button>
      </GlassCard>

      <div>
        <h2 class="profile-settings-section-title">
          {{ locale.t.profile.settingsLanguageSection }}
        </h2>
        <GlassCard padding="none" class="overflow-hidden">
          <div class="divide-y divide-border/70">
            <button
              v-for="lang in LOCALES"
              :key="lang.value"
              type="button"
              class="profile-settings-action pressable"
              @click="pickLanguage(lang.value)"
            >
              <span class="profile-settings-row__icon profile-settings-row__icon--violet">
                <Languages class="size-3.5" />
              </span>
              <span
                class="min-w-0 flex-1 text-left text-[13px] font-semibold"
                :class="locale.locale === lang.value ? 'text-primary' : 'text-foreground'"
              >
                {{ lang.label }}
              </span>
              <Check
                v-if="locale.locale === lang.value"
                class="size-3.5 shrink-0 text-primary"
                aria-hidden="true"
              />
            </button>
          </div>
        </GlassCard>
      </div>

      <div>
        <h2 class="profile-settings-section-title">
          {{ locale.t.profile.settingsThemeSection }}
        </h2>
        <GlassCard padding="sm" class="!p-2.5">
          <ThemeSwitcher />
        </GlassCard>
      </div>
    </section>
  </div>
</template>
