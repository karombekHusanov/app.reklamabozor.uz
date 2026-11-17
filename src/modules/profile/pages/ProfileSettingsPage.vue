<script setup lang="ts">
import { ChevronRight, FileText, Handshake } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { LOCALES, type Locale } from '@/core/i18n/messages'
import { useTelegram } from '@/core/composables/useTelegram'
import { ROUTES } from '@/modules/shell/constants/routes'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { isBusinessUser } from '@/modules/auth/types/user'
import ThemeSwitcher from '@/modules/profile/components/ThemeSwitcher.vue'
import { DARK_MODE_ENABLED } from '@/core/stores/theme.store'

// App-only settings: language, theme, legal documents. Profile editing lives on
// the profile page — it is not repeated here.
const auth = useAuthStore()
const locale = useLocaleStore()
const router = useRouter()
const { haptic } = useTelegram()

const isProvider = computed(() => (auth.user ? isBusinessUser(auth.user) : false))

/** Short segment labels — the full names are in `LOCALES`. */
const SHORT: Record<Locale, string> = { uz: "O'zbekcha", ru: 'Русский', en: 'English' }

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

    <section class="space-y-5 px-4">
      <div>
        <h2 class="profile-settings-section-title">
          {{ locale.t.profile.settingsLanguageSection }}
        </h2>
        <div
          role="radiogroup"
          :aria-label="locale.t.profile.settingsLanguageSection"
          class="pss-segment"
        >
          <button
            v-for="lang in LOCALES"
            :key="lang.value"
            type="button"
            role="radio"
            :aria-checked="locale.locale === lang.value"
            :aria-label="lang.label"
            class="pss-segment__btn"
            :class="{ 'pss-segment__btn--on': locale.locale === lang.value }"
            @click="pickLanguage(lang.value)"
          >
            {{ SHORT[lang.value] }}
          </button>
        </div>
      </div>

      <div v-if="DARK_MODE_ENABLED">
        <h2 class="profile-settings-section-title">
          {{ locale.t.profile.settingsThemeSection }}
        </h2>
        <GlassCard
          padding="sm"
          class="!p-2.5"
        >
          <ThemeSwitcher />
        </GlassCard>
      </div>

      <div>
        <h2 class="profile-settings-section-title">
          {{ locale.t.profile.settingsLegalSection }}
        </h2>
        <div class="app-list">
          <button
            type="button"
            class="app-list-row pressable"
            @click="navigate(ROUTES.publicOffer)"
          >
            <span class="app-list-row__icon">
              <FileText class="size-4" />
            </span>
            <span class="app-list-row__body">
              <span class="app-list-row__label">{{ locale.t.profile.settingsPublicOffer }}</span>
            </span>
            <ChevronRight
              class="app-list-row__chevron"
              aria-hidden="true"
            />
          </button>
          <button
            v-if="isProvider"
            type="button"
            class="app-list-row pressable"
            @click="navigate(ROUTES.agentOffer)"
          >
            <span class="app-list-row__icon">
              <Handshake class="size-4" />
            </span>
            <span class="app-list-row__body">
              <span class="app-list-row__label">{{ locale.t.legal.agentOfferTitle }}</span>
            </span>
            <ChevronRight
              class="app-list-row__chevron"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pss-segment {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; padding: 4px;
  border-radius: var(--rb-r-tile); background: var(--muted);
}
.pss-segment__btn {
  min-height: 44px; border: 0; border-radius: calc(var(--rb-r-tile) - 4px); background: transparent;
  color: var(--muted-foreground); font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background var(--rb-dur) var(--rb-ease), color var(--rb-dur) var(--rb-ease);
}
.pss-segment__btn--on { background: var(--card); color: var(--foreground); font-weight: 700; box-shadow: var(--rb-elev-1); }
.pss-segment__btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
</style>
