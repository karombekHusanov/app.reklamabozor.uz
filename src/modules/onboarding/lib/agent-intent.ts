import { readPref, writePref } from '@/core/lib/cloud-prefs'

/**
 * Front-end-only: whether a non-agent user hid the home "become an agency"
 * invite. It grants nothing. Keyed by user id because pref storage is shared
 * between Telegram accounts on one device.
 */
const key = (userId: number) => `adspace_agent_intent_${userId}`

export function isAgentInviteDismissed(userId: number): boolean {
  return readPref(key(userId)) === 'dismissed'
}

export function dismissAgentInvite(userId: number): void {
  writePref(key(userId), 'dismissed')
}
