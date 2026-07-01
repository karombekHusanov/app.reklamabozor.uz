<script setup lang="ts">
import { X } from '@lucide/vue'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'

defineProps<{
  title?: string
}>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <Transition name="drawer-fade">
        <DialogOverlay class="fixed inset-0 z-[100] bg-black/50" />
      </Transition>
      <Transition name="drawer-slide">
        <DialogContent
          class="fixed inset-x-0 bottom-0 z-[100] flex max-h-[85vh] flex-col rounded-t-3xl bg-card pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl outline-none dark:bg-[#0c1f36]"
        >
          <DialogDescription class="sr-only">
            {{ title }}
          </DialogDescription>

          <div class="flex shrink-0 items-center justify-center pb-1 pt-2.5">
            <div class="h-1.5 w-10 rounded-full bg-muted-foreground/25" />
          </div>

          <div class="flex shrink-0 items-center justify-between px-5 pb-3 pt-1">
            <DialogTitle v-if="title" class="text-lg font-bold leading-tight">
              {{ title }}
            </DialogTitle>
            <span v-else />
            <DialogClose class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:scale-95 dark:bg-white/10">
              <X class="size-4" />
            </DialogClose>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-5">
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
