<script setup lang="ts">
import { useLocaleStore } from '@/core/i18n/locale.store'

defineProps<{
  nearby?: number
  online?: number
}>()

const emit = defineEmits<{
  map: []
  chat: []
}>()

const locale = useLocaleStore()
</script>

<template>
  <div class="feats">
    <button
      type="button"
      class="feat"
      :aria-label="locale.t.home.adMapTitle"
      @click="emit('map')"
    >
      <div
        class="feat__viz feat__viz--map"
        aria-hidden="true"
      >
        <span
          v-if="nearby && nearby > 0"
          class="feat__badge"
        ><span class="feat__pindot" />{{ nearby }} {{ locale.t.home.wordNearby }}</span>
        <span class="mpin mpin--a" />
        <span class="mpin mpin--b" />
        <span class="mpin mpin--c"><span class="mpin__ping" /></span>
      </div>
      <div class="feat__info">
        <p class="feat__title">
          {{ locale.t.home.adMapTitle }}
        </p>
        <p class="feat__sub">
          {{ locale.t.home.adMapSub }}
        </p>
      </div>
    </button>

    <button
      type="button"
      class="feat"
      :aria-label="locale.t.home.globalChat"
      @click="emit('chat')"
    >
      <div
        class="feat__viz feat__viz--chat"
        aria-hidden="true"
      >
        <span
          v-if="online && online > 0"
          class="feat__badge"
        ><span class="grn2" />{{ online }} {{ locale.t.home.wordOnline }}</span>
        <span class="chat-avs"><span class="cav cav--1" /><span class="cav cav--2" /><span class="cav cav--3" /></span>
        <span class="chat-bubble"><i /><i /><i /></span>
      </div>
      <div class="feat__info">
        <p class="feat__title">
          {{ locale.t.home.globalChat }}
        </p>
        <p class="feat__sub">
          {{ locale.t.home.globalChatSub }}
        </p>
      </div>
    </button>
  </div>
</template>

<style scoped>
.feats { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
.feat {
  position: relative; text-align: left; cursor: pointer; padding: 0;
  background: var(--card); border: 1px solid var(--border); border-radius: 18px;
  overflow: hidden; box-shadow: var(--rb-elev-1);
  display: flex; flex-direction: column;
  transition: transform var(--rb-dur) var(--rb-ease), border-color var(--rb-dur) var(--rb-ease);
  -webkit-tap-highlight-color: transparent;
}
.feat:hover { transform: translateY(-2px); border-color: var(--primary); }
.feat:active { transform: scale(0.98); }
.feat:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.feat__viz { position: relative; height: 90px; overflow: hidden; }
.feat__badge {
  position: absolute; top: 8px; right: 8px; z-index: 3;
  display: inline-flex; align-items: center; gap: 4px;
  background: rgba(255, 255, 255, 0.94); color: #0b3f7a;
  font-size: 10px; font-weight: 800; padding: 3px 7px; border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
}
.grn2 { width: 6px; height: 6px; border-radius: 999px; background: var(--success); box-shadow: 0 0 0 0 rgba(18, 183, 106, .5); animation: pulseGrn 2s ease-out infinite; }
.feat__pindot { width: 6px; height: 6px; border-radius: 999px; background: #0b6bcb; }
.feat__info { padding: 11px 12px 13px; }
.feat__title { font-family: var(--rb-font-display); font-weight: 800; font-size: 15px; margin: 0; letter-spacing: -0.01em; color: var(--foreground); }
.feat__sub { margin: 3px 0 0; font-size: 11.5px; line-height: 1.35; color: var(--muted-foreground); min-height: 30px; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; overflow: hidden; }

.feat__viz--map { background: color-mix(in srgb, var(--primary) 12%, var(--card)); }
.feat__viz--map::before {
  content: ""; position: absolute; inset: -2px;
  background:
    repeating-linear-gradient(90deg, transparent 0 21px, color-mix(in srgb, var(--primary) 20%, transparent) 21px 23px),
    repeating-linear-gradient(0deg, transparent 0 16px, color-mix(in srgb, var(--primary) 15%, transparent) 16px 18px);
}
.feat__viz--map::after {
  content: ""; position: absolute; left: -12%; right: -12%; top: 54%; height: 8px;
  background: color-mix(in srgb, var(--primary) 30%, transparent); transform: rotate(-13deg);
}
.mpin { position: absolute; z-index: 2; width: 14px; height: 14px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 3px 5px rgba(0, 0, 0, 0.3); }
.mpin::after { content: ""; position: absolute; inset: 4px; border-radius: 50%; background: #fff; }
.mpin--a { left: 20%; top: 22%; background: #0b6bcb; }
.mpin--b { left: 60%; top: 15%; background: var(--rb-cta); }
.mpin--c { left: 43%; top: 48%; background: #0b6bcb; }
.mpin__ping { position: absolute; inset: -7px; border-radius: 50%; border: 2px solid #0b6bcb; animation: mping 2.2s ease-out infinite; }

.feat__viz--chat { background: linear-gradient(150deg, #0b6bcb, #013f86); }
.feat__viz--chat::before { content: ""; position: absolute; top: -32px; right: -30px; width: 96px; height: 96px; border-radius: 50%; background: radial-gradient(circle, rgba(56, 189, 248, .55), transparent 70%); }
.chat-avs { position: absolute; left: 12px; top: 14px; display: flex; z-index: 2; }
.cav { width: 27px; height: 27px; border-radius: 50%; border: 2px solid #0b3f7a; margin-left: -9px; box-shadow: 0 2px 4px rgba(0, 0, 0, .28); }
.cav--1 { margin-left: 0; background: linear-gradient(150deg, #7cc0ff, #0b6bcb); }
.cav--2 { background: linear-gradient(150deg, #fca5a5, #ef4444); }
.cav--3 { background: linear-gradient(150deg, #86efac, #16a34a); }
.chat-bubble { position: absolute; left: 14px; bottom: 12px; z-index: 2; display: inline-flex; align-items: center; gap: 3px; background: #fff; padding: 6px 9px; border-radius: 11px 11px 11px 3px; box-shadow: 0 3px 8px rgba(0, 0, 0, .25); }
.chat-bubble i { width: 5px; height: 5px; border-radius: 50%; background: #0b6bcb; opacity: .45; animation: typing 1.4s ease-in-out infinite; }
.chat-bubble i:nth-child(2) { animation-delay: .2s; }
.chat-bubble i:nth-child(3) { animation-delay: .4s; }

@keyframes mping { 0% { transform: scale(.5); opacity: .85; } 100% { transform: scale(1.9); opacity: 0; } }
@keyframes typing { 0%, 60%, 100% { transform: translateY(0); opacity: .4; } 30% { transform: translateY(-3px); opacity: 1; } }
@keyframes pulseGrn { 0% { box-shadow: 0 0 0 0 rgba(18, 183, 106, .5); } 70% { box-shadow: 0 0 0 6px rgba(18, 183, 106, 0); } 100% { box-shadow: 0 0 0 0 rgba(18, 183, 106, 0); } }

@media (prefers-reduced-motion: reduce) {
  .mpin__ping, .chat-bubble i, .grn2 { animation: none !important; }
}
</style>
