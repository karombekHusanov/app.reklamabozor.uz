<script setup lang="ts">
import { ChevronRight, ClipboardList, Menu, Send, Settings, User } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'
import type { Component } from 'vue'
import { computed, nextTick, ref, watch } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'

const props = defineProps<{
  isProvider: boolean
}>()

const emit = defineEmits<{
  navigate: [to: string]
}>()

const locale = useLocaleStore()
const open = ref(false)
const wrapRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref({ top: '0px', left: '0px' })

onClickOutside(wrapRef, (event) => {
  const target = event.target as Node | null
  if (target && menuRef.value?.contains(target)) return
  open.value = false
}, { ignore: [menuRef] })

interface MenuItem {
  key: string
  label: string
  to: string
  icon: Component
  tone: 'sky' | 'violet' | 'teal' | 'amber'
}

const items = computed<MenuItem[]>(() => {
  const list: MenuItem[] = [
    { key: 'profile', label: locale.t.home.menuProfile, to: ROUTES.profile, icon: User, tone: 'sky' },
    { key: 'settings', label: locale.t.home.menuSettings, to: ROUTES.settings, icon: Settings, tone: 'violet' },
    {
      key: 'orders',
      label: locale.t.home.menuMyOrders || locale.t.shell.tabs.myOrders,
      to: ROUTES.orders,
      icon: ClipboardList,
      tone: 'teal',
    },
  ]

  if (props.isProvider) {
    list.push({
      key: 'offers',
      label: locale.t.home.menuOffers,
      to: ROUTES.offers,
      icon: Send,
      tone: 'amber',
    })
  }

  return list
})

async function updateMenuPosition() {
  await nextTick()
  const anchor = wrapRef.value
  if (!anchor) return

  const rect = anchor.getBoundingClientRect()
  menuStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
  }
}

async function toggle() {
  if (!open.value) {
    open.value = true
    await updateMenuPosition()
    return
  }

  open.value = false
}

function pick(to: string) {
  open.value = false
  emit('navigate', to)
}

watch(open, (isOpen) => {
  if (isOpen) void updateMenuPosition()
})
</script>

<template>
  <div ref="wrapRef" class="relative">
    <button
      type="button"
      class="pressable home-icon-btn"
      :aria-expanded="open"
      :aria-label="locale.t.home.menuTitle"
      aria-haspopup="menu"
      @click="toggle"
    >
      <Menu class="size-5" />
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1 scale-[0.98]"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 -translate-y-1 scale-[0.98]"
      >
        <nav
          v-if="open"
          ref="menuRef"
          class="home-menu-dropdown"
          :style="menuStyle"
          :aria-label="locale.t.home.menuTitle"
        >
          <ul class="home-menu-dropdown__list">
            <li v-for="item in items" :key="item.key">
              <button
                type="button"
                role="menuitem"
                class="home-menu-dropdown__item pressable"
                @click="pick(item.to)"
              >
                <span
                  class="home-menu-dropdown__icon"
                  :class="`home-menu-dropdown__icon--${item.tone}`"
                >
                  <component :is="item.icon" class="size-4" />
                </span>
                <span class="home-menu-dropdown__label">{{ item.label }}</span>
                <ChevronRight class="home-menu-dropdown__chevron" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </nav>
      </Transition>
    </Teleport>
  </div>
</template>
