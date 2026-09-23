import { reactive } from 'vue'
import type { Component } from 'vue'

/**
 * App-wide confirmation, rendered by the single `ConfirmDrawer` mounted in
 * App.vue (never the browser / Telegram native popup, which looks like a
 * system permission prompt). Await it: `if (!(await confirmAction(...))) return`.
 */
export interface ConfirmOptions {
  message: string
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` = destructive action (sign out, end chat): red confirm button. */
  tone?: 'default' | 'danger'
  icon?: Component
  /** Highlighted line under the message, e.g. what the action costs. */
  note?: string
}

interface ConfirmState extends ConfirmOptions {
  open: boolean
}

export const confirmState = reactive<ConfirmState>({ open: false, message: '' })

let pending: ((ok: boolean) => void) | null = null

export function confirmAction(input: string | ConfirmOptions): Promise<boolean> {
  const options = typeof input === 'string' ? { message: input } : input

  // A new question replaces an unanswered one — that one counts as "no".
  settleConfirm(false)

  Object.assign(confirmState, {
    title: undefined,
    confirmLabel: undefined,
    cancelLabel: undefined,
    tone: 'default',
    icon: undefined,
    note: undefined,
    ...options,
    open: true,
  })

  return new Promise((resolve) => {
    pending = resolve
  })
}

/** Called by the drawer: a button, the close icon, or a swipe/overlay dismiss. */
export function settleConfirm(ok: boolean) {
  confirmState.open = false
  const resolve = pending
  pending = null
  resolve?.(ok)
}
