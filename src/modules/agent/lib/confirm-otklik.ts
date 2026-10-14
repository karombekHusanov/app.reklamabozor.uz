import { MapPin } from '@lucide/vue'
import router from '@/app/router'
import { confirmAction } from '@/core/lib/confirm-action'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { workReadiness, workReadinessEditPath } from '@/modules/agent/lib/work-readiness'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import { usePassStore } from '@/modules/agent/stores/pass.store'

/**
 * Send an otklik (interest) right away — no confirmation sheet. Two things
 * interrupt it:
 * - an approved profile without service categories or a map location: the
 *   executor may not start working yet, so we explain what is missing and
 *   offer to open that profile tab instead of sending;
 * - money: in pay-per-otklik mode, when the balance cannot cover the fee we
 *   open the top-up drawer (which resends after paying) instead of failing
 *   with 402.
 * The server stays the judge for everything else.
 */
export async function confirmOtklik(send: () => unknown): Promise<void> {
  const agent = useAgentStore()
  await agent.loadProfile()

  const readiness = workReadiness(agent.profile)
  if (readiness.blocked) {
    const t = useLocaleStore().t.executor
    const missing = [
      readiness.missingCategories ? t.readyCategories : null,
      readiness.missingLocation ? t.readyLocation : null,
    ].filter(Boolean).join(', ')

    const go = await confirmAction({
      title: t.readyTitle,
      message: t.readyBody,
      note: `${t.readyMissing}: ${missing}`,
      confirmLabel: t.readyCta,
      icon: MapPin,
    })
    if (go) void router.push(workReadinessEditPath(readiness))
    return
  }

  const store = usePassStore()
  await store.ensureLoaded()

  if (store.otklikFeeSom > 0 && !store.canAffordOtklik) {
    store.promptTopup(send)
    return
  }

  await send()
}
