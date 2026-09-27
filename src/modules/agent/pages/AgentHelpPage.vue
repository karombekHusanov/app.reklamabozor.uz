<script setup lang="ts">
import { ChevronRight, Phone } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import { CONTACT_PHONE } from '@/modules/shell/constants/contact'
import { ROUTES } from '@/modules/shell/constants/routes'
import { useModeStore } from '@/modules/shell/stores/mode.store'

/** Agent "Support" tab: grouped links to help, app switches and legal documents. */
const locale = useLocaleStore()
const router = useRouter()
const mode = useModeStore()

interface HelpRow { label: string, sub?: string, value?: string, action: () => void }

const t = computed(() => locale.t.agentHome.help)

const groups = computed<{ title: string, rows: HelpRow[] }[]>(() => [
  {
    title: t.value.support,
    rows: [
      { label: t.value.assistant, action: () => router.push(ROUTES.assistant) },
      { label: t.value.call, value: CONTACT_PHONE, action: () => { window.location.href = `tel:${CONTACT_PHONE}` } },
    ],
  },
  {
    title: t.value.app,
    rows: [
      { label: t.value.clientMode, sub: t.value.clientModeSub, action: () => { mode.set('client'); void router.replace(ROUTES.home) } },
      { label: t.value.settings, action: () => router.push(ROUTES.settings) },
    ],
  },
  {
    title: t.value.docs,
    rows: [
      { label: t.value.agentOffer, action: () => router.push(ROUTES.agentOffer) },
      { label: t.value.publicOffer, action: () => router.push(ROUTES.publicOffer) },
    ],
  },
])
</script>

<template>
  <div class="pb-6">
    <AppHeader :title="t.title" />
    <section
      v-for="group in groups"
      :key="group.title"
      class="help-group"
    >
      <h2 class="help-group__title">
        {{ group.title }}
      </h2>
      <button
        v-for="row in group.rows"
        :key="row.label"
        type="button"
        class="help-row"
        @click="row.action"
      >
        <span class="help-row__text">
          <span>{{ row.label }}</span>
          <span
            v-if="row.sub"
            class="help-row__sub"
          >{{ row.sub }}</span>
        </span>
        <span
          v-if="row.value"
          class="help-row__value"
        ><Phone class="size-3.5" />{{ row.value }}</span>
        <ChevronRight
          v-else
          class="size-4 text-muted-foreground"
        />
      </button>
    </section>
  </div>
</template>

<style scoped>
.help-group { margin: 0 12px 10px; padding: 14px 16px 4px; border-radius: 20px; background: var(--card); }
.help-group__title { margin: 0 0 2px; font-size: 13px; letter-spacing: 0.02em; color: var(--muted-foreground); font-weight: 600; }
.help-row {
  display: flex; width: 100%; min-height: 48px; align-items: center; gap: 10px; padding: 0;
  border: 0; background: none; color: var(--foreground); font-family: inherit; font-size: 14.5px; text-align: left; cursor: pointer;
}
.help-row:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 8px; }
.help-row__text { display: flex; flex: 1; flex-direction: column; gap: 2px; }
.help-row__sub { font-size: 12px; color: var(--muted-foreground); }
.help-row__value { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; color: var(--primary); }
</style>
