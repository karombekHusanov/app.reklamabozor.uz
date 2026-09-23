/**
 * Readable phone for display: Uzbek numbers as "+998 90 000 04 44";
 * anything else is returned unchanged. Links keep the raw digits.
 */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  const m = /^998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(digits)
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : raw
}
