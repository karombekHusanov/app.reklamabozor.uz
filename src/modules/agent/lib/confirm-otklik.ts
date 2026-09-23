import { Send } from '@lucide/vue'
import { confirmAction } from '@/core/lib/confirm-action'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { fmtSom, passStrings } from '@/modules/agent/lib/pass-i18n'
import { usePassStore } from '@/modules/agent/stores/pass.store'

/**
 * Ask before sending an otklik (interest). In pay-per-otklik mode the sheet
 * says what it costs and what is left; when the balance cannot cover it we go
 * straight to the top-up drawer (which resends after paying) instead of
 * confirming first and failing with 402 second. The server stays the judge.
 */
export async function confirmOtklik(send: () => unknown): Promise<void> {
  const store = usePassStore()
  const locale = useLocaleStore()
  await store.ensureLoaded()

  const t = passStrings(locale.locale)
  const fee = store.otklikFeeSom

  if (fee > 0 && !store.canAffordOtklik) {
    store.promptTopup(send)
    return
  }

  const ok = await confirmAction({
    title: locale.t.orders.showcase.sendInterest,
    message: locale.t.orders.showcase.sendInterestConfirm,
    confirmLabel: locale.t.orders.showcase.sendInterestCta,
    icon: Send,
    note: fee > 0
      ? t.otklikCost
          .replace('{price}', fmtSom(fee, t.unit))
          .replace('{left}', fmtSom(store.balanceSom - fee, t.unit))
      : undefined,
  })

  if (ok) await send()
}
