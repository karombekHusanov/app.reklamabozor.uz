import { hydratePref, readPref, writePref } from '@/core/lib/cloud-prefs'

/**
 * "Do you run an agency?" home banner — dismissed for good on the first tap of
 * its close button. Prefs are shared between Telegram accounts on one device,
 * so the flag is namespaced per user id; the same invite stays permanently
 * available on the profile page.
 */
const PREFIX = 'adspace_provider_invite_dismissed'

function key(userId: number): string {
  return `${PREFIX}:${userId}`
}

export function isProviderInviteDismissed(userId: number): boolean {
  return readPref(key(userId)) === '1'
}

/** Pull the flag from Telegram CloudStorage when the local cache is cold. */
export async function hydrateProviderInviteDismissed(userId: number): Promise<boolean> {
  return (await hydratePref(key(userId))) === '1'
}

export function dismissProviderInvite(userId: number): void {
  writePref(key(userId), '1')
}
