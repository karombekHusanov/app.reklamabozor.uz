<script setup lang="ts">
import { ArrowRight, Bell, Search } from '@lucide/vue'
import Avatar from '@/core/ui/Avatar.vue'
// import BillboardAd from '@/modules/home/components/BillboardAd.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'

defineProps<{
  displayName: string
  avatarSrc?: string | null
  notificationCount?: number
}>()

const emit = defineEmits<{
  /** Opens the global search drawer — the hero field is a trigger, not an input. */
  search: []
  notifications: []
  profile: []
}>()

const locale = useLocaleStore()
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

    <!-- real billboard, floating on the hero — hidden for now, headline is centered instead
    <span
      class="bbglow"
      aria-hidden="true"
    />
    <div class="bb">
      <BillboardAd />
    </div>
    -->

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
      <button
        type="button"
        class="hero__bell"
        :aria-label="locale.t.home.notificationsButton"
        @click="emit('notifications')"
      >
        <Bell class="size-[19px]" />
        <span
          v-if="notificationCount && notificationCount > 0"
          class="hero__bell-badge"
        >{{ notificationCount > 99 ? '99+' : notificationCount }}</span>
      </button>
    </div>

    <!-- headline -->
    <h1 class="hero__title">
      {{ locale.t.home.heroTitle }}
    </h1>
    <p class="hero__sub">
      {{ locale.t.home.heroSubtitle }}
    </p>

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

/* floating billboard */
.bbglow {
  position: absolute; top: 112px; right: 52px; width: 128px; height: 94px;
  border-radius: 50%; filter: blur(30px); z-index: 0; pointer-events: none;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.45), transparent 70%);
}
.bb {
  position: absolute; top: 92px; right: 32px; width: 138px; z-index: 1;
  transform: rotate(-5deg); pointer-events: none;
  border-radius: 16px; box-shadow: 0 24px 42px -16px rgba(0, 0, 0, 0.6);
  animation: bbFloat 9s ease-in-out infinite;
}

/* greeting */
.hero__greet { position: relative; z-index: 2; display: flex; align-items: center; gap: 12px; padding: 8px 0 18px; }
.hero__avatar { flex-shrink: 0; border-radius: 999px; border: 2px solid rgba(255, 255, 255, 0.35); }
.hero__id { flex: 1; min-width: 0; }
.hero__welcome { margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.72); font-weight: 600; }
.hero__name { margin: 1px 0 0; font-family: var(--rb-font-display); font-weight: 800; font-size: 16px; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hero__bell {
  position: relative; flex-shrink: 0; width: 42px; height: 42px; border-radius: 13px;
  background: rgba(255, 255, 255, 0.14); border: 1px solid rgba(255, 255, 255, 0.16);
  color: #fff; display: grid; place-items: center; transition: transform .12s ease, background .18s ease;
}
.hero__bell:active { transform: scale(0.92); }
.hero__bell-badge { position: absolute; top: -4px; right: -4px; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 999px; background: var(--rb-cta); color: #fff; font-size: 10px; font-weight: 800; line-height: 17px; text-align: center; border: 2px solid #023059; }

/* headline with animated colour gradient */
.hero__title {
  position: relative; z-index: 2;
  font-family: var(--rb-font-display); font-weight: 800; font-size: 26px;
  line-height: 1.12; letter-spacing: -0.022em; margin: 10px 0 0;
  text-align: center; text-wrap: balance;
  background-image: linear-gradient(102deg, #ffffff 0%, #6ee7ff 16%, var(--rb-glow) 33%, #a78bfa 54%, #ffbf6b 76%, #ffffff 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
  animation: titleShine 7s linear infinite;
}
.hero__sub { position: relative; z-index: 2; margin: 10px 0 0; font-size: 13.5px; line-height: 1.5; color: rgba(255, 255, 255, 0.82); text-align: center; text-wrap: balance; }

/* search */
.hero__search {
  position: relative; z-index: 2; margin-top: 24px;
  display: flex; width: 100%; align-items: center; gap: 10px; height: 54px; padding: 0 7px 0 16px;
  border-radius: 16px; background: #fff; box-shadow: 0 18px 32px -16px rgba(0, 0, 0, 0.6);
}
.hero__search { border: 0; cursor: pointer; text-align: left; font-family: inherit; transition: transform var(--rb-dur) var(--rb-ease); }
.hero__search:active { transform: scale(0.985); }
.hero__search:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.hero__search-ic { color: #7a8699; flex-shrink: 0; }
.hero__search-ph { flex: 1; min-width: 0; font-size: 14.5px; color: #94a0b2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hero__search-go { flex-shrink: 0; width: 38px; height: 38px; border-radius: 11px; background: linear-gradient(150deg, #0b6bcb 0%, #014ba4 100%); color: #fff; display: grid; place-items: center; }

@keyframes titleShine { from { background-position: 0% center; } to { background-position: 200% center; } }
@keyframes bbFloat { 0%, 100% { transform: rotate(-5deg) translateY(0); } 50% { transform: rotate(-3.6deg) translateY(-12px); } }
@keyframes heroGlow { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-16px, 14px); } }

@media (prefers-reduced-motion: reduce) {
  .hero__title, .bb, .hero__glow--a, .hero__glow--b { animation: none !important; }
}
</style>
