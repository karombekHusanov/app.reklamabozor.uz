import { usePassStore } from '@/modules/agent/stores/pass.store'

/**
 * Send an otklik (interest) right away — no confirmation sheet. The only thing
 * that interrupts is money: in pay-per-otklik mode, when the balance cannot
 * cover the fee we open the top-up drawer (which resends after paying) instead
 * of failing with 402. The server stays the judge.
 */
export async function confirmOtklik(send: () => unknown): Promise<void> {
  const store = usePassStore()
  await store.ensureLoaded()

  if (store.otklikFeeSom > 0 && !store.canAffordOtklik) {
    store.promptTopup(send)
    return
  }

  await send()
}
