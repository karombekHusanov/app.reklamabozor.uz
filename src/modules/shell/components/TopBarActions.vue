<script setup lang="ts">
import { Bell, Map as MapIcon, Phone } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { CONTACT_PHONE } from '@/modules/shell/constants/contact'

/** Glass icon buttons of the dark top bars: optional map, call, notifications. */
defineProps<{
  notificationCount?: number
  showMap?: boolean
}>()

const emit = defineEmits<{ map: [], notifications: [] }>()

const locale = useLocaleStore()
</script>

<template>
  <button
    v-if="showMap"
    type="button"
    class="tba"
    :aria-label="locale.t.agentHome.map"
    @click="emit('map')"
  >
    <MapIcon class="size-[19px]" />
  </button>
  <a
    :href="`tel:${CONTACT_PHONE}`"
    class="tba"
    :aria-label="locale.t.agentHome.call"
  >
    <Phone class="size-[18px]" />
  </a>
  <button
    type="button"
    class="tba"
    :aria-label="locale.t.agentHome.notifications"
    @click="emit('notifications')"
  >
    <Bell class="size-[19px]" />
    <span
      v-if="notificationCount && notificationCount > 0"
      class="tba__badge"
    >{{ notificationCount > 99 ? '99+' : notificationCount }}</span>
  </button>
</template>

<style scoped>
.tba {
  position: relative; flex-shrink: 0; width: 42px; height: 42px; border-radius: 13px;
  background: rgba(255, 255, 255, 0.14); border: 1px solid rgba(255, 255, 255, 0.16);
  color: #fff; display: grid; place-items: center; cursor: pointer; transition: transform .12s ease;
  -webkit-tap-highlight-color: transparent;
}
.tba:active { transform: scale(0.92); }
.tba:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.tba__badge {
  position: absolute; top: -4px; right: -4px; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 999px;
  background: var(--rb-cta); color: #fff; font-size: 10px; font-weight: 800; line-height: 13px; text-align: center; border: 2px solid #023059;
}
</style>
