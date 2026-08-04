/** Timestamp of the last time the user opened the Live Orders list. */
export const LIVE_ORDERS_SEEN_KEY = 'adspace_live_orders_seen_at'

export function readLiveOrdersSeenAt(): string | null {
  try {
    return localStorage.getItem(LIVE_ORDERS_SEEN_KEY)
  }
  catch {
    return null
  }
}

export function writeLiveOrdersSeenAt(iso: string): void {
  try {
    localStorage.setItem(LIVE_ORDERS_SEEN_KEY, iso)
  }
  catch {
    // Private mode / quota — ignore; in-memory store still works for the session.
  }
}
