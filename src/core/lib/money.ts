/** Strip non-digits and parse UZS amount (whole sums only). */
export function parseMoneyInput(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return 0
  const value = Number(digits)
  return Number.isFinite(value) ? value : 0
}

/** Thousand-separated display for money inputs (no currency suffix). */
export function formatMoneyInput(value: number | string): string {
  const amount = typeof value === 'string' ? parseMoneyInput(value) : Math.max(0, Math.floor(value))
  if (amount <= 0) return ''
  return new Intl.NumberFormat('uz-UZ').format(amount)
}

/** Keep caret near the end after reformatting — good enough for mobile numeric entry. */
export function maskMoneyInput(raw: string): { amount: number, display: string } {
  const amount = parseMoneyInput(raw)
  return {
    amount,
    display: amount > 0 ? formatMoneyInput(amount) : '',
  }
}
