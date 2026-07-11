<script setup lang="ts">
import { Menu } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'

const emit = defineEmits<{
  navigate: [to: string]
}>()

const locale = useLocaleStore()
const open = ref(false)
const wrapRef = ref<HTMLElement | null>(null)

onClickOutside(wrapRef, () => {
  open.value = false
})

const items = computed(() => [
  { label: locale.t.home.menuProfile, to: ROUTES.profile },
  { label: locale.t.home.menuSettings, to: ROUTES.settings },
  { label: locale.t.home.menuAdvertise, to: ROUTES.newOrder },
  { label: locale.t.home.menuOperator, to: ROUTES.chat },
])

function toggle() {
  open.value = !open.value
}

function pick(to: string) {
  open.value = false
  emit('navigate', to)
}
</script>

<template>
  <div ref="wrapRef" class="relative">
    <button
      type="button"
      class="flex size-10 items-center justify-center rounded-xl bg-white/10 transition active:scale-95"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggle"
    >
      <Menu class="size-5 text-white" />
    </button>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-1 scale-95"
    >
      <div
        v-if="open"
        role="menu"
        class="absolute left-0 top-12 z-50 min-w-[11rem] overflow-hidden rounded-2xl border border-white/15 bg-[#02305C]/95 py-1 shadow-xl backdrop-blur-sm"
      >
        <button
          v-for="(item, index) in items"
          :key="item.to + item.label"
          type="button"
          role="menuitem"
          class="block w-full px-4 py-3 text-left text-sm font-medium text-white transition active:bg-white/10"
          :class="index !== items.length - 1 && 'border-b border-[#0386D9]/40'"
          @click="pick(item.to)"
        >
          {{ item.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>
