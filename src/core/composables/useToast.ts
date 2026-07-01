import { readonly, ref } from 'vue'

export type ToastType = 'error' | 'success' | 'info'

export interface Toast {
  id: number
  type: ToastType
  message: string
}

// Module-level singleton so any component can push toasts to the single <Toaster>.
const toasts = ref<Toast[]>([])
let seq = 0

function push(type: ToastType, message: string, duration = 4500) {
  const id = ++seq
  toasts.value = [...toasts.value, { id, type, message }]

  if (duration > 0) {
    setTimeout(() => dismiss(id), duration)
  }

  return id
}

function dismiss(id: number) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    error: (message: string) => push('error', message),
    success: (message: string) => push('success', message),
    info: (message: string) => push('info', message),
    dismiss,
  }
}
