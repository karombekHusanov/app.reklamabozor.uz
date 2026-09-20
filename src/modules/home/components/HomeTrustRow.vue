<script setup lang="ts">
import { Phone } from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { PlatformContact } from '@/modules/home/services/platform-contact.service'

const props = defineProps<{ contact: PlatformContact | null }>()

const locale = useLocaleStore()

const phone = computed(() => props.contact?.phone?.trim() || null)
const hours = computed(() => props.contact?.work_hours?.trim() || null)
const telHref = computed(() => (phone.value ? `tel:${phone.value.replace(/[^\d+]/g, '')}` : undefined))
</script>

<template>
  <div
    v-if="phone"
    class="trust"
  >
    <p class="trust__line">
      <Phone
        class="trust__icon"
        aria-hidden="true"
      />
      <a
        :href="telHref"
        class="trust__phone"
        :aria-label="`${locale.t.home.trustPhoneLabel}: ${phone}`"
      >{{ phone }}</a>
      <template v-if="hours">
        <span aria-hidden="true">·</span>
        <span>{{ locale.t.home.trustHours.replace('{hours}', hours) }}</span>
      </template>
    </p>
    <p class="trust__note">
      {{ locale.t.home.trustAnytime }}
    </p>
  </div>
</template>

<style scoped>
.trust {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.trust__line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground);
}
.trust__icon {
  width: 14px;
  height: 14px;
  color: var(--rb-glow);
  flex-shrink: 0;
}
.trust__phone {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-block: -14px;
  font-weight: 700;
  color: var(--foreground);
  text-decoration: none;
}
.trust__phone:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: 6px;
}
.trust__note {
  font-size: 11px;
  color: var(--muted-foreground);
}
</style>
