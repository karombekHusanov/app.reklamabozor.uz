<script setup lang="ts">
import { FileEdit, Inbox, MessageSquare } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'

const locale = useLocaleStore()
</script>

<template>
  <section aria-label="How it works">
    <div class="sec-head">
      <span class="sec-eyebrow">{{ locale.t.home.howItWorks }}</span>
      <h2 class="sec-title">
        {{ locale.t.home.stepsTitle }}
      </h2>
    </div>

    <div class="stepper">
      <div class="stepx">
        <span class="stepx__ic"><b>1</b><FileEdit class="size-[21px]" /></span>
        <p class="stepx__t">
          {{ locale.t.home.step1Title }}
        </p>
        <p class="stepx__d">
          {{ locale.t.home.step1Sub }}
        </p>
      </div>
      <div class="stepx">
        <span class="stepx__ic"><b>2</b><Inbox class="size-[21px]" /></span>
        <p class="stepx__t">
          {{ locale.t.home.step2Title }}
        </p>
        <p class="stepx__d">
          {{ locale.t.home.step2Sub }}
        </p>
      </div>
      <div class="stepx">
        <span class="stepx__ic"><b>3</b><MessageSquare class="size-[21px]" /></span>
        <p class="stepx__t">
          {{ locale.t.home.step3Title }}
        </p>
        <p class="stepx__d">
          {{ locale.t.home.step3Sub }}
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sec-head { margin-bottom: 13px; }
.sec-eyebrow { font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); display: block; margin-bottom: 3px; }
.sec-title { font-family: var(--rb-font-display); font-weight: 800; font-size: 18px; letter-spacing: -0.015em; margin: 0; color: var(--foreground); }

.stepper { position: relative; display: flex; padding-top: 2px; }
.stepper::before {
  content: ""; position: absolute; top: 27px; left: 17%; right: 17%; height: 2px; z-index: 0; border-radius: 2px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--primary) 14%, transparent), color-mix(in srgb, var(--primary) 42%, transparent), color-mix(in srgb, var(--primary) 14%, transparent));
}
.stepx { position: relative; z-index: 1; flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 9px; text-align: center; padding: 0 2px; }
.stepx__ic { position: relative; width: 50px; height: 50px; border-radius: 16px; display: grid; place-items: center; color: #fff; background: linear-gradient(150deg, #0386d9, #014ba4); box-shadow: 0 9px 18px -8px rgba(3, 134, 217, 0.7); }
.stepx__ic b { position: absolute; top: -6px; right: -6px; width: 21px; height: 21px; border-radius: 999px; background: var(--rb-cta); color: #fff; font-family: var(--rb-font-display); font-size: 11px; font-weight: 800; display: grid; place-items: center; border: 2.5px solid var(--background); }
.stepx__t { font-family: var(--rb-font-display); font-weight: 800; font-size: 12.5px; margin: 0; color: var(--foreground); line-height: 1.1; letter-spacing: -0.01em; }
.stepx__d { font-size: 10.5px; margin: 2px 0 0; color: var(--muted-foreground); line-height: 1.2; }
</style>
