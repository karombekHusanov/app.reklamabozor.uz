<script setup lang="ts">
/**
 * App bottom sheet — a thin wrapper over the shadcn drawer (`./drawer`), so every
 * sheet gets swipe-to-close, focus trapping and the same look. Keeps the old API:
 * `v-model:open`, `title`, `showClose`, `hideTitle`, default slot = body.
 */
import { X } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from './drawer'

withDefaults(defineProps<{
  title?: string
  showClose?: boolean
  /** Keep the title for screen readers only — the body renders its own heading. */
  hideTitle?: boolean
}>(), {
  title: undefined,
  showClose: true,
  hideTitle: false,
})

const open = defineModel<boolean>('open', { default: false })
const locale = useLocaleStore()
</script>

<template>
  <Drawer v-model:open="open">
    <DrawerContent
      class="z-[100] !max-h-[85vh] !rounded-t-[28px] border-border/60 bg-card pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-18px_48px_-20px_rgba(15,23,42,0.35)] outline-none dark:bg-[#0c1f36]"
    >
      <DrawerDescription class="sr-only">
        {{ title }}
      </DrawerDescription>
      <DrawerTitle
        v-if="title && hideTitle"
        class="sr-only"
      >
        {{ title }}
      </DrawerTitle>

      <div
        v-if="(title && !hideTitle) || showClose"
        class="flex shrink-0 items-center justify-between px-5 pb-2 pt-3"
      >
        <DrawerTitle
          v-if="title && !hideTitle"
          class="text-base font-bold leading-tight"
        >
          {{ title }}
        </DrawerTitle>
        <span v-else />
        <DrawerClose
          v-if="showClose"
          :aria-label="locale.t.common.close"
          class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:scale-95 dark:bg-white/10"
        >
          <X class="size-4" />
        </DrawerClose>
      </div>

      <div class="max-h-[min(70vh,calc(85vh-5rem))] overflow-y-auto px-4 pb-3 pt-2">
        <slot />
      </div>
    </DrawerContent>
  </Drawer>
</template>
