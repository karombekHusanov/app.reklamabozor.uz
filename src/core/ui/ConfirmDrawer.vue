<script setup lang="ts">
import { CircleHelp, TriangleAlert } from '@lucide/vue'
import { computed, watch } from 'vue'
import Drawer from '@/core/ui/Drawer.vue'
import { useTelegram } from '@/core/composables/useTelegram'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { confirmState, settleConfirm } from '@/core/lib/confirm-action'

/**
 * The one confirmation sheet for the whole app (see `confirmAction`). Icon,
 * question, optional cost/consequence note, then the two answers stacked in
 * the thumb zone — confirm first, cancel as a quiet second.
 */
const locale = useLocaleStore()
const { haptic } = useTelegram()

const open = computed({
  get: () => confirmState.open,
  set: (v: boolean) => { if (!v) settleConfirm(false) },
})

const danger = computed(() => confirmState.tone === 'danger')
const icon = computed(() => confirmState.icon ?? (danger.value ? TriangleAlert : CircleHelp))
const title = computed(() => confirmState.title ?? confirmState.message)
const body = computed(() => (confirmState.title ? confirmState.message : null))

watch(() => confirmState.open, (v) => { if (v) haptic('light') })

function answer(ok: boolean) {
  haptic(ok ? 'medium' : 'light')
  settleConfirm(ok)
}
</script>

<template>
  <Drawer
    v-model:open="open"
    :show-close="false"
  >
    <div class="cd">
      <span
        class="cd__ic"
        :class="{ 'cd__ic--danger': danger }"
        aria-hidden="true"
      ><component
        :is="icon"
        class="size-6"
      /></span>

      <p class="cd__title">
        {{ title }}
      </p>
      <p
        v-if="body"
        class="cd__body"
      >
        {{ body }}
      </p>
      <p
        v-if="confirmState.note"
        class="cd__note"
      >
        {{ confirmState.note }}
      </p>

      <div class="cd__actions">
        <button
          type="button"
          class="cd__btn cd__btn--primary"
          :class="{ 'cd__btn--danger': danger }"
          @click="answer(true)"
        >
          {{ confirmState.confirmLabel ?? locale.t.common.confirm }}
        </button>
        <button
          type="button"
          class="cd__btn cd__btn--ghost"
          @click="answer(false)"
        >
          {{ confirmState.cancelLabel ?? locale.t.common.cancel }}
        </button>
      </div>
    </div>
  </Drawer>
</template>

<style scoped>
.cd { display: flex; flex-direction: column; align-items: center; padding: 4px 4px 2px; text-align: center; }
.cd__ic {
  display: grid; place-items: center; width: 56px; height: 56px; border-radius: 18px;
  background: var(--secondary); color: var(--primary);
}
.cd__ic--danger { background: color-mix(in srgb, var(--destructive) 12%, var(--card)); color: var(--destructive); }
.cd__title {
  margin: 14px 0 0; max-width: 320px; font-family: var(--rb-font-display); font-size: 16.5px; font-weight: 600;
  line-height: 1.3; letter-spacing: -0.01em; color: var(--foreground); text-wrap: balance;
}
.cd__body { margin: 6px 0 0; max-width: 320px; font-size: 13px; font-weight: 400; line-height: 1.5; color: var(--muted-foreground); }
.cd__note {
  margin: 12px 0 0; padding: 9px 14px; border-radius: var(--rb-r-field); background: var(--secondary);
  font-size: 12.5px; font-weight: 500; color: var(--secondary-foreground);
}
.cd__actions { display: flex; flex-direction: column; gap: 6px; width: 100%; margin-top: 18px; }
.cd__btn {
  display: flex; align-items: center; justify-content: center; min-height: 52px; border: 0; border-radius: var(--rb-r-field);
  font-family: inherit; font-size: 15px; font-weight: 600; cursor: pointer;
  transition: transform var(--rb-dur) var(--rb-ease);
  -webkit-tap-highlight-color: transparent;
}
.cd__btn:active { transform: scale(0.98); }
.cd__btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.cd__btn--primary { color: #fff; background: linear-gradient(150deg, var(--primary) 0%, var(--brand-600) 100%); box-shadow: 0 12px 24px -12px color-mix(in srgb, var(--primary) 70%, transparent); }
.cd__btn--danger { background: var(--destructive); box-shadow: none; }
.cd__btn--ghost { min-height: 46px; background: none; color: var(--muted-foreground); font-family: inherit; font-size: 14px; font-weight: 500; }
</style>
