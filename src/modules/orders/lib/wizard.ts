import type { OrderBudget } from '@/modules/orders/types/order'

/** Ordered budget bands. Labels live in i18n (`orders.wizard.budgets.*`). */
export const BUDGET_OPTIONS: OrderBudget[] = ['lt_1m', 'from_1_3m', 'from_3_5m', 'from_5_10m', 'gt_10m']

/** Human-readable file size, e.g. 2_516_582 → "2.4 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

/** Whether an uploaded file is an image (drives the preview vs. file-icon choice). */
export function isImageFile(mime: string | null): boolean {
  return !!mime && mime.startsWith('image/')
}
