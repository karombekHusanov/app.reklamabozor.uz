import { defineStore } from 'pinia'
import WebApp from '@twa-dev/sdk'
import { Centrifuge, UnauthorizedError, type PublicationContext } from 'centrifuge'
import { ref } from 'vue'
import { api } from '@/core/api/client'
import type { ApiSuccess } from '@/core/types/api'
import type { LiveStats } from '@/modules/home/services/live-stats.service'

/** Channel the backend pushes live stats to (server-side subscription). */
const PULSE_CHANNEL = 'live:pulse'

/** Personal channel (`user:{id}`) — chat messages + read receipts. */
const USER_CHANNEL_PREFIX = 'user:'

/** A push on the personal channel (`chat.message`, `chat.read`, …). */
export interface RealtimeUserEvent {
  type: string
  [key: string]: unknown
}

/** Thrown by `rpc()` when the socket isn't up — callers fall back to HTTP. */
export class RealtimeUnavailableError extends Error {}

/** Centrifugo reply error ({code, message}) from an RPC proxy call. */
export class RealtimeRpcError extends Error {
  constructor(public code: number, message: string) {
    super(message)
  }
}

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
 * the user goes offline right away. The same socket carries client ↔ agent
 * chat: pushes on `user:{id}`, sends/read-marks via `rpc()`.
 */
export const useRealtimeStore = defineStore('realtime', () => {
  const connected = ref(false)
  const liveStats = ref<LiveStats | null>(null)

  let client: Centrifuge | null = null
  let starting = false
  let unbind: (() => void)[] = []
  let everConnected = false

  const userListeners = new Set<(event: RealtimeUserEvent) => void>()
  const reconnectListeners = new Set<() => void>()

  function onPublication(ctx: PublicationContext) {
    if (ctx.channel === PULSE_CHANNEL && ctx.data?.type === 'stats') {
      liveStats.value = ctx.data.stats as LiveStats
      return
    }
    if (ctx.channel.startsWith(USER_CHANNEL_PREFIX) && typeof ctx.data?.type === 'string') {
      userListeners.forEach(fn => fn(ctx.data as RealtimeUserEvent))
    }
  }

  function onConnected() {
    connected.value = true
    // Pushes sent while we were offline are gone — listeners re-sync over HTTP.
    if (everConnected) reconnectListeners.forEach(fn => fn())
    everConnected = true
  }

  /** Subscribe to personal-channel pushes; returns the unsubscribe. */
  function onUserEvent(handler: (event: RealtimeUserEvent) => void): () => void {
    userListeners.add(handler)
    return () => userListeners.delete(handler)
  }

  /** Called after the socket comes back (not on the first connect). */
  function onReconnect(handler: () => void): () => void {
    reconnectListeners.add(handler)
    return () => reconnectListeners.delete(handler)
  }

  /**
   * Call a backend action over the socket (Centrifugo RPC proxy). Throws
   * `RealtimeUnavailableError` when offline so the caller can use HTTP.
   */
  async function rpc<T>(method: string, data: Record<string, unknown>): Promise<T> {
    if (!client || !connected.value) throw new RealtimeUnavailableError('socket offline')
    try {
      const reply = await client.rpc(method, data)
      return reply.data as T
    }
    catch (e) {
      // Already on the wire: don't let the caller resend over HTTP (could
      // double-post) — surface the error instead.
      const err = e as { code?: number, message?: string }
      throw new RealtimeRpcError(err.code ?? 0, err.message ?? 'Request failed')
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
      client.on('connected', onConnected)
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
    everConnected = false
  }

  return { connected, liveStats, start, stop, rpc, onUserEvent, onReconnect }
})
