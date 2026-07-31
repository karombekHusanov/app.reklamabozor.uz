<script setup lang="ts">
import { ChevronRight, ClipboardList, Menu, MessageCircle, Send, Settings, User } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'
import type { Component } from 'vue'
import { computed, nextTick, ref, watch } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { ROUTES } from '@/modules/shell/constants/routes'

const props = defineProps<{
  isProvider: boolean
  /** Open marketplace offers — shown on the Offers row for approved providers. */
  offersCount?: number
  /** Unread agency/order chats — shown on the Chats row. */
  chatsUnread?: number
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
  tone: 'sky' | 'violet' | 'teal' | 'amber' | 'indigo'
  badge?: number
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
    {
      key: 'chats',
      label: locale.t.home.quickAgencyChats,
      to: ROUTES.chatThreads,
      icon: MessageCircle,
      tone: 'indigo',
      badge: props.chatsUnread && props.chatsUnread > 0 ? props.chatsUnread : undefined,
    },
  ]

  if (props.isProvider) {
    list.push({
      key: 'offers',
      label: locale.t.home.menuOffers,
      to: ROUTES.offers,
      icon: Send,
      tone: 'amber',
      badge: props.offersCount && props.offersCount > 0 ? props.offersCount : undefined,
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
      class="pressable home-icon-btn relative"
      :aria-expanded="open"
      :aria-label="locale.t.home.menuTitle"
      aria-haspopup="menu"
      @click="toggle"
    >
      <Menu class="size-5" />
      <span
        v-if="(chatsUnread ?? 0) > 0 || (isProvider && (offersCount ?? 0) > 0)"
        class="absolute right-2.5 top-2.5 size-2 rounded-full bg-destructive"
        aria-hidden="true"
      />
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
                <span class="home-menu-dropdown__meta">
                  <span
                    v-if="item.badge"
                    class="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white"
                  >
                    {{ item.badge > 99 ? '99+' : item.badge }}
                  </span>
                  <ChevronRight class="home-menu-dropdown__chevron" aria-hidden="true" />
                </span>
              </button>
            </li>
          </ul>
        </nav>
      </Transition>
    </Teleport>
  </div>
</template>
