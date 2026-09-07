<script setup lang="ts">
import { ArrowRight, Megaphone, X } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useTelegram } from '@/core/composables/useTelegram'

const emit = defineEmits<{
  apply: []
  dismiss: []
}>()

const locale = useLocaleStore()
const { haptic } = useTelegram()

function apply() {
  haptic('medium')
  emit('apply')
}

function dismiss() {
  haptic('light')
  emit('dismiss')
}
</script>

<template>
  <section
    class="invite"
    :aria-label="locale.t.home.providerInviteTitle"
  >
    <span
      class="invite__orb invite__orb--a"
      aria-hidden="true"
    />
    <span
      class="invite__orb invite__orb--b"
      aria-hidden="true"
    />
    <span
      class="invite__sheen"
      aria-hidden="true"
    />

    <button
      type="button"
      class="invite__close"
      :aria-label="locale.t.home.providerInviteDismiss"
      @click="dismiss"
    >
      <X class="size-[17px]" />
    </button>

    <div class="invite__body">
      <span
        class="invite__badge"
        aria-hidden="true"
      >
        <Megaphone class="size-[22px]" />
      </span>

      <h2 class="invite__title">
        {{ locale.t.home.providerInviteTitle }}
      </h2>
      <p class="invite__sub">
        {{ locale.t.home.providerInviteBody }}
      </p>

      <button
        type="button"
        class="invite__cta"
        @click="apply"
      >
        {{ locale.t.home.providerInviteCta }}
        <ArrowRight class="size-[17px]" />
      </button>
    </div>
  </section>
</template>

<style scoped>
.invite {
  position: relative;
  overflow: hidden;
  border-radius: var(--rb-r-card);
  background: var(--rb-hero-grad);
  box-shadow: var(--rb-elev-2);
  color: #fff;
  isolation: isolate;
}

/* drifting brand orbs — depth without a busy illustration */
.invite__orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(34px);
  pointer-events: none;
}
.invite__orb--a {
  top: -46px;
  right: -30px;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, color-mix(in srgb, var(--rb-glow) 55%, transparent) 0%, transparent 70%);
  animation: inviteDrift 12s ease-in-out infinite;
}
.invite__orb--b {
  bottom: -60px;
  left: -40px;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(3, 134, 217, 0.55) 0%, transparent 72%);
  animation: inviteDrift 15s ease-in-out infinite reverse;
}

/* slow light sweep across the card */
.invite__sheen {
  position: absolute;
  inset: -40% -60%;
  background: linear-gradient(
    100deg,
    transparent 38%,
    rgba(255, 255, 255, 0.16) 48%,
    rgba(255, 255, 255, 0.04) 56%,
    transparent 64%
  );
  transform: translateX(-60%);
  animation: inviteSheen 6.5s ease-in-out infinite;
  pointer-events: none;
}

.invite__close {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: transform var(--rb-dur) var(--rb-ease), background var(--rb-dur) var(--rb-ease);
}
.invite__close:active { transform: scale(0.9); background: rgba(255, 255, 255, 0.22); }
.invite__close:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

.invite__body {
  position: relative;
  z-index: 1;
  padding: 18px 18px 20px;
}

.invite__badge {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: var(--rb-r-icon);
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #fff;
  animation: inviteFloat 4.5s ease-in-out infinite;
}

.invite__title {
  margin: 14px 0 0;
  max-width: 20ch;
  font-family: var(--rb-font-display);
  font-weight: 800;
  font-size: 19px;
  line-height: 1.2;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.invite__sub {
  margin: 8px 0 0;
  max-width: 34ch;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.82);
}

.invite__cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  margin-top: 16px;
  padding: 0 18px;
  border: 0;
  border-radius: var(--rb-r-field);
  background: #fff;
  color: #02305c;
  cursor: pointer;
  font-family: var(--rb-font-display);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.01em;
  box-shadow: 0 10px 22px -12px rgba(0, 0, 0, 0.65);
  transition: transform var(--rb-dur) var(--rb-ease);
}
.invite__cta:active { transform: scale(0.96); }
.invite__cta:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }

@keyframes inviteDrift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-18px, 14px); }
}
@keyframes inviteSheen {
  0%, 62% { transform: translateX(-60%); }
  100% { transform: translateX(60%); }
}
@keyframes inviteFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@media (prefers-reduced-motion: reduce) {
  .invite__orb, .invite__sheen, .invite__badge { animation: none; }
  .invite__sheen { opacity: 0; }
  .invite__close, .invite__cta { transition: none; }
  .invite__close:active, .invite__cta:active { transform: none; }
}
</style>
