<script setup lang="ts">
import { X } from '@lucide/vue'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'

withDefaults(defineProps<{
  title?: string
  showClose?: boolean
}>(), {
  showClose: true,
})

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <Transition name="drawer-fade">
        <DialogOverlay class="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]" />
      </Transition>
      <Transition name="drawer-slide">
        <DialogContent
          class="fixed inset-x-0 bottom-0 z-[100] flex max-h-[85vh] flex-col rounded-t-[28px] border-t border-border/60 bg-card pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-18px_48px_-20px_rgba(15,23,42,0.35)] outline-none dark:bg-[#0c1f36]"
        >
          <DialogDescription class="sr-only">
            {{ title }}
          </DialogDescription>

          <div class="flex shrink-0 items-center justify-center pb-2 pt-3">
            <div class="h-1 w-9 rounded-full bg-muted-foreground/20" />
          </div>

          <div
            v-if="title || showClose"
            class="flex shrink-0 items-center justify-between px-5 pb-2 pt-0"
          >
            <DialogTitle v-if="title" class="text-base font-bold leading-tight">
              {{ title }}
            </DialogTitle>
            <span v-else />
            <DialogClose
              v-if="showClose"
              class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:scale-95 dark:bg-white/10"
            >
              <X class="size-4" />
            </DialogClose>
          </div>

          <div class="max-h-[min(70vh,calc(85vh-5rem))] overflow-y-auto px-4 pb-3">
            <slot />
          </div>
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 250ms ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active {
  transition: transform 380ms cubic-bezier(0.22, 1, 0.36, 1);
}
.drawer-slide-leave-active {
  transition: transform 220ms cubic-bezier(0.4, 0, 1, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateY(100%);
}
</style>
