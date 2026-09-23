<script setup lang="ts">
import { ArrowRight, Clock, Lock, ShieldCheck, Zap } from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'

/**
 * Tezkor vs Tender as two full-width rows (not two cramped columns): each
 * says what it is in one line, its benefits as chips, and has one action.
 * Tezkor starts straight away; Tender starts, or — without access — asks
 * for it (pending access shows its status instead of a button).
 */
const props = defineProps<{
  canCreateTender: boolean
  tenderStatus: string
}>()

const emit = defineEmits<{
  pick: [route: 'tezkor' | 'tender']
  requestAccess: []
}>()

const locale = useLocaleStore()

const tenderNote = computed(() => {
  if (props.tenderStatus === 'pending') return locale.t.route.accessPending
  if (props.tenderStatus === 'revoked') return locale.t.route.accessRevoked
  return null
})

function onTender() {
  if (props.canCreateTender) emit('pick', 'tender')
  else if (props.tenderStatus !== 'pending') emit('requestAccess')
}
</script>

<template>
  <section :aria-label="locale.t.landing.routesTitle">
    <span class="rb-eyebrow">{{ locale.t.landing.routesEyebrow }}</span>
    <h2 class="rb-sec__title rt__title">
      {{ locale.t.landing.routesTitle }}
    </h2>

    <div class="rt">
      <!-- Tezkor -->
      <button
        type="button"
        class="rtc rb-stagger"
        @click="emit('pick', 'tezkor')"
      >
        <span class="rtc__head">
          <span
            class="rtc__ic"
            aria-hidden="true"
          ><Zap class="size-5" /></span>
          <span class="rtc__id">
            <span class="rtc__name">{{ locale.t.route.tezkor }}</span>
            <span class="rtc__pitch">{{ locale.t.landing.tezkorPitch }}</span>
          </span>
          <span
            class="rtc__go"
            aria-hidden="true"
          ><ArrowRight class="size-[18px]" /></span>
        </span>
        <span class="rtc__desc">{{ locale.t.landing.tz1 }}</span>
        <span class="rtc__chips">
          <span class="rtc__chip">{{ locale.t.landing.tz2 }}</span>
          <span class="rtc__chip">{{ locale.t.landing.tz3 }}</span>
        </span>
      </button>

      <!-- Tender -->
      <div
        class="rtc rtc--tender rb-stagger"
        :style="{ '--i': 1 }"
        :role="tenderStatus === 'pending' && !canCreateTender ? undefined : 'button'"
        :tabindex="tenderStatus === 'pending' && !canCreateTender ? undefined : 0"
        @click="onTender"
        @keydown.enter="onTender"
      >
        <span class="rtc__head">
          <span
            class="rtc__ic"
            aria-hidden="true"
          ><ShieldCheck class="size-5" /></span>
          <span class="rtc__id">
            <span class="rtc__name">
              {{ locale.t.route.tender }}
              <span
                v-if="!canCreateTender"
                class="rtc__lock"
              ><Lock class="size-3" />{{ locale.t.landing.routeLocked }}</span>
            </span>
            <span class="rtc__pitch">{{ locale.t.landing.tenderPitch }}</span>
          </span>
          <span
            v-if="canCreateTender"
            class="rtc__go"
            aria-hidden="true"
          ><ArrowRight class="size-[18px]" /></span>
        </span>
        <span class="rtc__desc">{{ locale.t.landing.td1 }}</span>
        <span class="rtc__chips">
          <span class="rtc__chip">{{ locale.t.landing.td2 }}</span>
          <span class="rtc__chip">{{ locale.t.landing.td3 }}</span>
        </span>

        <span
          v-if="!canCreateTender && tenderStatus === 'pending'"
          class="rtc__status"
        >
          <Clock class="size-4 shrink-0" />
          {{ tenderNote }}
        </span>
        <span
          v-else-if="!canCreateTender"
          class="rtc__cta"
        >
          {{ locale.t.route.requestAccess }}
          <ArrowRight class="size-4" />
        </span>
      </div>
    </div>

    <p
      v-if="tenderStatus === 'revoked'"
      class="rt__foot"
    >
      {{ tenderNote }}
    </p>
  </section>
</template>

<style scoped>
.rt__title { margin-top: 3px; }
.rt { display: flex; flex-direction: column; gap: 10px; margin-top: 13px; }

.rtc {
  display: flex; flex-direction: column; align-items: stretch; gap: 10px; width: 100%; padding: 14px;
  background: var(--card); border: 1px solid var(--border); border-radius: var(--rb-r-card); box-shadow: var(--rb-elev-1);
  color: var(--foreground); font-family: inherit; text-align: left; cursor: pointer;
  transition: transform var(--rb-dur) var(--rb-ease), border-color var(--rb-dur) var(--rb-ease);
  -webkit-tap-highlight-color: transparent;
}
.rtc:active { transform: scale(0.985); }
.rtc:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.rtc--tender {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
  background: linear-gradient(160deg, color-mix(in srgb, var(--primary) 9%, var(--card)) 0%, var(--card) 70%);
}

.rtc__head { display: flex; align-items: center; gap: 12px; }
.rtc__ic { flex-shrink: 0; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 14px; background: var(--secondary); color: var(--primary); }
.rtc--tender .rtc__ic { color: #fff; background: linear-gradient(150deg, var(--rb-glow) -30%, var(--primary) 70%); }
.rtc__id { display: flex; flex: 1; min-width: 0; flex-direction: column; }
.rtc__name { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-family: var(--rb-font-display); font-size: 16.5px; font-weight: 900; letter-spacing: -0.02em; }
.rtc__pitch { margin-top: 1px; font-size: 12px; font-weight: 700; color: var(--primary); }
.rtc__lock {
  display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: var(--rb-r-chip);
  background: var(--secondary); color: var(--secondary-foreground); font-family: inherit; font-size: 10px; font-weight: 800; letter-spacing: 0;
}
.rtc__go { flex-shrink: 0; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 999px; background: var(--primary); color: #fff; }

.rtc__desc { font-size: 13px; line-height: 1.4; color: var(--muted-foreground); }
.rtc__chips { display: flex; flex-wrap: wrap; gap: 6px; }
.rtc__chip {
  display: inline-flex; align-items: center; padding: 5px 10px; border-radius: var(--rb-r-chip);
  background: var(--secondary); color: var(--secondary-foreground); font-size: 11.5px; font-weight: 700;
}
.rtc--tender .rtc__chip { background: var(--card); border: 1px solid color-mix(in srgb, var(--primary) 25%, var(--border)); }

.rtc__cta {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; margin-top: 2px;
  border-radius: 13px; background: var(--primary); color: #fff; font-family: var(--rb-font-display); font-size: 13.5px; font-weight: 800;
}
.rtc__status { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; color: var(--foreground); }
.rt__foot { margin: 8px 2px 0; font-size: 11.5px; color: var(--muted-foreground); }
</style>
