import { defineStore } from 'pinia'
import WebApp from '@twa-dev/sdk'
import { Centrifuge, UnauthorizedError, type PublicationContext } from 'centrifuge'
import { ref } from 'vue'
import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { LiveStats } from '@/modules/home/services/live-stats.service'

/** Channel the backend pushes live stats to (server-side subscription). */
const PULSE_CHANNEL = 'live:pulse'

type RealtimeToken =
  | { enabled: false }
  | { enabled: true, ws_url: string, token: string, expires_at: string }

async function fetchRealtimeToken(): Promise<RealtimeToken> {
  const { data } = await api.post<ApiSuccess<RealtimeToken>>('/api/v1/realtime/token')

  return data.data
}

/** Telegram `activated`/`deactivated` exist from Bot API 8.0 — older clients just never fire them. */
function onTelegram(event: 'activated' | 'deactivated', handler: () => void): () => void {
  try {
    WebApp.onEvent(event as never, handler)
    return () => {
      try { WebApp.offEvent(event as never, handler) }
      catch { /* unsupported */ }
    }
  }
  catch {
    return () => {}
  }
}

/**
 * One WebSocket (Centrifugo) per open mini app. Being connected *is* being
 * online — presence lives in Centrifugo's memory, no heartbeat requests, no
 * DB writes — and the backend pushes live stats here instead of every client
 * polling GET /stats/live. The socket is dropped while the app is hidden so
 * the user goes offline right away.
 */
export const useRealtimeStore = defineStore('realtime', () => {
  const connected = ref(false)
  const liveStats = ref<LiveStats | null>(null)

  let client: Centrifuge | null = null
  let starting = false
  let unbind: (() => void)[] = []

  function onPublication(ctx: PublicationContext) {
    if (ctx.channel === PULSE_CHANNEL && ctx.data?.type === 'stats') {
      liveStats.value = ctx.data.stats as LiveStats
    }
  }

  function pause() {
    client?.disconnect()
  }

  function resume() {
    client?.connect()
  }

  function onVisibility() {
    if (document.visibilityState === 'hidden') pause()
    else resume()
  }

  function bindLifecycle() {
    document.addEventListener('visibilitychange', onVisibility)
    unbind = [
      () => document.removeEventListener('visibilitychange', onVisibility),
      onTelegram('deactivated', pause),
      onTelegram('activated', resume),
    ]
  }

  async function start() {
    if (client || starting) return
    starting = true
    try {
      const first = await fetchRealtimeToken()
      if (!first.enabled) return

      client = new Centrifuge(first.ws_url, {
        token: first.token,
        // Called on expiry / reconnect with a stale token.
        getToken: async () => {
          const next = await fetchRealtimeToken()
          if (!next.enabled) throw new UnauthorizedError('realtime disabled')
          return next.token
        },
      })
      client.on('connected', () => { connected.value = true })
      client.on('connecting', () => { connected.value = false })
      client.on('disconnected', () => { connected.value = false })
      client.on('publication', onPublication)
      bindLifecycle()

      if (document.visibilityState !== 'hidden') client.connect()
    }
    catch {
      // Realtime is an enhancement — the app keeps working on HTTP polling.
    }
    finally {
      starting = false
    }
  }

  function stop() {
    unbind.forEach(fn => fn())
    unbind = []
    client?.disconnect()
    client?.removeAllListeners()
    client = null
    connected.value = false
  }

  return { connected, liveStats, start, stop }
})
