<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/core/ui/drawer'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { fullName } from '@/modules/auth/types/user'
import { ROUTES } from '@/modules/shell/constants/routes'
import { useModeStore } from '@/modules/shell/stores/mode.store'

/** Account menu sheet (100px below the top) opened from the avatar on the client home. */
const open = defineModel<boolean>('open', { default: false })

const locale = useLocaleStore()
const router = useRouter()
const auth = useAuthStore()
const mode = useModeStore()

const name = computed(() => (auth.user ? fullName(auth.user) : ''))

const rows = computed(() => {
  const m = locale.t.clientHome.menu
  return [
    { label: m.orders, to: ROUTES.orders },
    { label: m.chats, to: ROUTES.chatThreads },
    { label: m.profile, to: ROUTES.profile },
    { label: m.settings, to: ROUTES.settings },
    { label: m.assistant, to: ROUTES.assistant },
    { label: m.offer, to: ROUTES.publicOffer },
    ...(mode.canUseAgent ? [] : [{ label: m.becomeAgent, to: `${ROUTES.profileEdit}?as=agent` }]),
  ]
})

function go(to: string) {
  open.value = false
  void router.push(to)
}
</script>

<template>
  <Drawer v-model:open="open">
    <!-- Stops 100px below the top so the page stays visible behind it. -->
    <DrawerContent class="z-[110] !mt-0 h-[calc(100dvh-100px)] !max-h-none !rounded-t-[28px] border-border/60 bg-card px-4 pb-[max(env(safe-area-inset-bottom),16px)] dark:bg-[#0c1f36]">
      <DrawerTitle class="sr-only">
        {{ locale.t.clientHome.profileMenu }}
      </DrawerTitle>
      <DrawerDescription class="sr-only">
        {{ name }}
      </DrawerDescription>
      <div class="cpm">
        <button
          type="button"
          class="cpm__who"
          @click="go(ROUTES.profile)"
        >
          <Avatar
            :src="auth.user?.avatar"
            :name="name"
            class="cpm__avatar"
          />
          <span class="cpm__id">
            <span class="cpm__name">{{ name }}</span>
            <span class="cpm__phone">{{ auth.user?.phone }}</span>
          </span>
          <ChevronRight class="size-5 text-muted-foreground" />
        </button>
        <nav class="cpm__list">
          <button
            v-for="row in rows"
            :key="row.to"
            type="button"
            class="cpm__row"
            @click="go(row.to)"
          >
            <span class="flex-1">{{ row.label }}</span>
            <ChevronRight class="size-5 text-muted-foreground" />
          </button>
        </nav>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<style scoped>
.cpm { flex: 1; min-height: 0; overflow-y: auto; padding-top: 4px; }
.cpm__who { display: flex; width: 100%; align-items: center; gap: 14px; padding: 16px 0; border: 0; background: none; color: inherit; font-family: inherit; text-align: left; cursor: pointer; }
.cpm__avatar { width: 64px; height: 64px; border-radius: 18px; }
.cpm__id { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 2px; }
.cpm__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 20px; font-weight: 600; }
.cpm__phone { font-size: 13.5px; color: var(--muted-foreground); }
.cpm__list { display: flex; flex-direction: column; }
.cpm__row {
  display: flex; min-height: 54px; align-items: center; gap: 10px; padding: 0; border: 0; border-bottom: 1px solid var(--border);
  background: none; color: inherit; font-family: inherit; font-size: 15.5px; text-align: left; cursor: pointer;
}
.cpm__row:last-child { border-bottom: 0; }
.cpm__who:focus-visible, .cpm__row:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
</style>
