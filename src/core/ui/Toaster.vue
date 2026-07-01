<script setup lang="ts">
import { CircleAlert, CircleCheck, Info, X } from '@lucide/vue'
import { useToast } from '@/core/composables/useToast'

const { toasts, dismiss } = useToast()

const icons = {
  error: CircleAlert,
  success: CircleCheck,
  info: Info,
}

const tone = {
  error: 'bg-red-500 text-white',
  success: 'bg-emerald-500 text-white',
  info: 'bg-slate-800 text-white',
}
</script>

<template>
  <div class="safe-top pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-3">
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-3 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="tone[toast.type]"
        class="pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-2xl px-4 py-3 shadow-lg"
        role="alert"
        @click="dismiss(toast.id)"
      >
        <component :is="icons[toast.type]" class="mt-0.5 size-5 shrink-0" />
        <p class="flex-1 text-sm font-medium leading-snug">
          {{ toast.message }}
        </p>
        <button type="button" class="shrink-0 opacity-80 transition hover:opacity-100" :aria-label="'Close'" @click.stop="dismiss(toast.id)">
          <X class="size-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
