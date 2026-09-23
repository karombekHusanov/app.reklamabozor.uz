<script setup lang="ts">
import { ChevronRight, FileText, Headset, Phone, Sparkles } from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { PlatformContact } from '@/modules/home/services/platform-contact.service'

/** Page footer: a real person to call, the assistant, the public offer, legal role. */
const props = defineProps<{ contact: PlatformContact | null }>()

const emit = defineEmits<{ assistant: [], offer: [] }>()

const locale = useLocaleStore()

const phone = computed(() => props.contact?.phone?.trim() || null)
const hours = computed(() => props.contact?.work_hours?.trim() || null)
const telHref = computed(() => (phone.value ? `tel:${phone.value.replace(/[^\d+]/g, '')}` : undefined))
</script>

<template>
  <section
    class="sp"
    :aria-label="locale.t.landing.supportTitle"
  >
    <div class="sp__head">
      <span
        class="sp__ic"
        aria-hidden="true"
      ><Headset class="size-5" /></span>
      <div class="min-w-0">
        <h2 class="sp__title">
          {{ locale.t.landing.supportTitle }}
        </h2>
        <p
          v-if="hours"
          class="sp__hours"
        >
          {{ locale.t.home.trustHours.replace('{hours}', hours) }}
        </p>
      </div>
    </div>

    <div class="sp__rows">
      <a
        v-if="phone"
        :href="telHref"
        class="sp__row"
        :aria-label="`${locale.t.landing.supportCall}: ${phone}`"
      >
        <Phone class="sp__row-ic" />
        <span class="sp__row-t">{{ locale.t.landing.supportCall }}</span>
        <span class="sp__row-v">{{ phone }}</span>
      </a>
      <button
        type="button"
        class="sp__row"
        @click="emit('assistant')"
      >
        <Sparkles class="sp__row-ic" />
        <span class="sp__row-t">{{ locale.t.landing.supportAssistant }}</span>
        <ChevronRight class="sp__chev" />
      </button>
      <button
        type="button"
        class="sp__row"
        @click="emit('offer')"
      >
        <FileText class="sp__row-ic" />
        <span class="sp__row-t">{{ locale.t.landing.supportOffer }}</span>
        <ChevronRight class="sp__chev" />
      </button>
    </div>

    <p class="sp__legal">
      {{ locale.t.landing.supportLegal }}
    </p>
  </section>
</template>

<style scoped>
.sp { padding: 16px; background: var(--card); border: 1px solid var(--border); border-radius: var(--rb-r-card); box-shadow: var(--rb-elev-1); }
.sp__head { display: flex; align-items: center; gap: 12px; }
.sp__ic { flex-shrink: 0; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 14px; background: var(--secondary); color: var(--primary); }
.sp__title { margin: 0; font-family: var(--rb-font-display); font-weight: 800; font-size: 16px; letter-spacing: -0.015em; color: var(--foreground); }
.sp__hours { margin: 2px 0 0; font-size: 12px; color: var(--muted-foreground); }

.sp__rows { display: flex; flex-direction: column; margin-top: 12px; border-top: 1px solid var(--border); }
.sp__row {
  display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 0 2px; border: 0; border-bottom: 1px solid var(--border);
  background: none; color: var(--foreground); text-decoration: none; font-family: inherit; font-size: 13.5px; font-weight: 600; text-align: left; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.sp__row:last-child { border-bottom: 0; }
.sp__row:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 6px; }
.sp__row-ic { width: 17px; height: 17px; color: var(--primary); flex-shrink: 0; }
.sp__row-t { flex: 1; min-width: 0; }
.sp__row-v { font-weight: 700; font-variant-numeric: tabular-nums; color: var(--primary); }
.sp__chev { width: 16px; height: 16px; color: var(--muted-foreground); }
.sp__legal { margin: 10px 0 0; font-size: 11px; line-height: 1.45; color: var(--muted-foreground); }
</style>
