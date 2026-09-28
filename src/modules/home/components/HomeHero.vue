<script setup lang="ts">
import { ArrowRight, ChevronDown, Search, ShieldCheck } from '@lucide/vue'
import Avatar from '@/core/ui/Avatar.vue'
import HomeBillboard from '@/modules/home/components/HomeBillboard.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import ModeSwitch from '@/modules/shell/components/ModeSwitch.vue'
import TopBarActions from '@/modules/shell/components/TopBarActions.vue'
import { useModeStore } from '@/modules/shell/stores/mode.store'

defineProps<{
  displayName: string
  avatarSrc?: string | null
  notificationCount?: number
  /** New orders waiting on the agent side — shown on the switch. */
  agentBadge?: number
}>()

const emit = defineEmits<{
  /** Opens the global search drawer — the hero field is a trigger, not an input. */
  search: []
  notifications: []
  profile: []
  /** Scroll to the "Safe deal" explainer. */
  trust: []
}>()

const locale = useLocaleStore()
const mode = useModeStore()
</script>

<template>
  <header class="hero brand-hero safe-top">
    <span
      class="hero__glow hero__glow--a"
      aria-hidden="true"
    />
    <span
      class="hero__glow hero__glow--b"
      aria-hidden="true"
    />

    <!-- greeting -->
    <div class="hero__greet">
      <button
        type="button"
        class="hero__avatar"
        :aria-label="locale.t.home.menuProfile"
        @click="emit('profile')"
      >
        <Avatar
          :src="avatarSrc"
          :name="displayName"
          class="size-11 rounded-full"
        />
      </button>
      <div class="hero__id">
        <p class="hero__welcome">
          {{ locale.t.home.welcome }}
        </p>
        <p class="hero__name">
          {{ displayName }}
        </p>
      </div>
      <TopBarActions
        :notification-count="notificationCount"
        @notifications="emit('notifications')"
      />
    </div>

    <!-- Client | Agent workspace switch, only for provider accounts -->
    <div
      v-if="mode.canUseAgent"
      class="hero__mode"
    >
      <ModeSwitch :badge="agentBadge" />
    </div>

    <!-- headline now lives on the billboard's screen, cycling like a real display -->
    <HomeBillboard class="hero__billboard" />

    <!-- search — opens the global search drawer -->
    <button
      type="button"
      class="hero__search"
      :aria-label="locale.t.search.title"
      @click="emit('search')"
    >
      <Search class="hero__search-ic size-[19px]" />
      <span class="hero__search-ph">{{ locale.t.home.heroSearchPlaceholder }}</span>
      <span
        class="hero__search-go"
        aria-hidden="true"
      >
        <ArrowRight class="size-[17px]" />
      </span>
    </button>

    <!-- trust promise — the first thing a new client should read -->
    <button
      type="button"
      class="hero__trust"
      @click="emit('trust')"
    >
      <span
        class="hero__trust-ic"
        aria-hidden="true"
      ><ShieldCheck class="size-4" /></span>
      <span class="hero__trust-t">{{ locale.t.landing.heroTrust }}</span>
      <span class="hero__trust-more">
        {{ locale.t.landing.heroTrustMore }}
        <ChevronDown class="size-3.5" />
      </span>
    </button>
  </header>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  padding: calc(max(env(safe-area-inset-top), 0.5rem) + 0.4rem) 1.5rem 4.5rem;
  color: #fff;
}

.hero__glow { position: absolute; border-radius: 999px; filter: blur(46px); pointer-events: none; }
.hero__glow--a { top: -40px; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(56, 189, 248, 0.5) 0%, transparent 70%); animation: heroGlow 13s ease-in-out infinite; }
.hero__glow--b { top: 40px; left: -70px; width: 180px; height: 180px; background: radial-gradient(circle, rgba(3, 134, 217, 0.5) 0%, transparent 72%); animation: heroGlow 16s ease-in-out infinite reverse; }

/* greeting */
.hero__greet { position: relative; z-index: 2; display: flex; align-items: center; gap: 12px; padding: 8px 0 18px; }
.hero__avatar { flex-shrink: 0; border-radius: 999px; border: 2px solid rgba(255, 255, 255, 0.35); }
.hero__id { flex: 1; min-width: 0; }
.hero__welcome { margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.72); font-weight: 600; }
.hero__name { margin: 1px 0 0; font-family: var(--rb-font-display); font-weight: 800; font-size: 16px; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* search */
.hero__search {
  position: relative; z-index: 2; margin-top: 10px;
  display: flex; width: 100%; align-items: center; gap: 10px; height: 54px; padding: 0 7px 0 16px;
  border-radius: 16px; background: #fff; box-shadow: 0 18px 32px -16px rgba(0, 0, 0, 0.6);
}
.hero__search { border: 0; cursor: pointer; text-align: left; font-family: inherit; transition: transform var(--rb-dur) var(--rb-ease); }
.hero__search:active { transform: scale(0.985); }
.hero__search:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.hero__search-ic { color: #7a8699; flex-shrink: 0; }
.hero__search-ph { flex: 1; min-width: 0; font-size: 14.5px; color: #94a0b2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hero__search-go { flex-shrink: 0; width: 38px; height: 38px; border-radius: 11px; background: linear-gradient(150deg, #0b6bcb 0%, #014ba4 100%); color: #fff; display: grid; place-items: center; }

/* trust pill */
.hero__trust {
  position: relative; z-index: 2; display: flex; width: 100%; align-items: center; gap: 10px; margin-top: 12px; min-height: 44px; padding: 6px 12px 6px 6px;
  border-radius: var(--rb-r-chip); border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.1);
  color: #fff; font-family: inherit; text-align: left; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.hero__trust:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.hero__trust-ic { flex-shrink: 0; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 999px; background: var(--success); color: #fff; }
.hero__trust-t { flex: 1; min-width: 0; font-size: 12.5px; font-weight: 700; line-height: 1.25; }
.hero__trust-more { flex-shrink: 0; display: inline-flex; align-items: center; gap: 2px; font-size: 11.5px; font-weight: 700; color: var(--rb-glow-soft); }

/* workspace switch */
.hero__mode { position: relative; z-index: 2; display: flex; margin: -6px 0 12px; }

/* billboard — sits a bit below the greeting, its pole fade blends into the search area behind it */
.hero__billboard { position: relative; z-index: 2; margin-top: 6px; }

@keyframes heroGlow { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-16px, 14px); } }

@media (prefers-reduced-motion: reduce) {
  .hero__glow--a, .hero__glow--b { animation: none !important; }
}
</style>
