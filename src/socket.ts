import type { HttpOptions } from './http.js'

/** Path on the API, relative to the base URL. */
const EVENTS_PATH = '/v1/events'

/** How long to wait before reconnecting after an unexpected close. */
const RETRY_MS = 5_000

export type EventMap = Record<string, object>

type Listener<E> = (data: E) => void

type WebSocketLike = {
  send(data: string): void
  close(code?: number, reason?: string): void
  readyState: number
  addEventListener(type: string, handler: (event: any) => void): void
}

export type SocketOptions = HttpOptions & {
  /** Injected in tests; defaults to the global WebSocket. */
  createSocket?: (url: string, headers: Record<string, string>) => WebSocketLike
}

function socketUrl(baseUrl: string): string {
  const url = new URL(EVENTS_PATH, baseUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

export class EventSocket<Events extends EventMap> {
  private readonly url: string
  private readonly headers: Record<string, string>
  private readonly createSocket: SocketOptions['createSocket']
  private readonly listeners = new Map<string, Set<Listener<never>>>()

  private socket: WebSocketLike | null = null
  private retry: ReturnType<typeof setTimeout> | null = null
  private closed = false

  constructor(options: SocketOptions = {}) {
    const base = (options.baseUrl ?? 'https://api.aegi.run').replace(/\/+$/, '')
    this.url = socketUrl(base)
    this.headers = options.apiKey
      ? { authorization: `Bearer ${options.apiKey}` }
      : {}
    this.createSocket =
      options.createSocket ??
      ((target, headers) =>
        new WebSocket(target, { headers } as never) as unknown as WebSocketLike)
  }

  get connected(): boolean {
    return this.socket !== null
  }

  get listenerCount(): number {
    let total = 0
    for (const set of this.listeners.values()) total += set.size
    return total
  }

  /** Opens the socket on first use and returns an unsubscribe function. */
  on<K extends keyof Events & string>(event: K, listener: Listener<Events[K]>) {
    return this.add(event, listener, false)
  }

  once<K extends keyof Events & string>(
    event: K,
    listener: Listener<Events[K]>,
  ) {
    return this.add(event, listener, true)
  }

  off<K extends keyof Events & string>(
    event: K,
    listener: Listener<Events[K]>,
  ) {
    const set = this.listeners.get(event)
    if (!set) return

    set.delete(listener as Listener<never>)
    if (set.size === 0) this.listeners.delete(event)

    // Nothing left to hear, so the socket has no reason to stay open.
    if (this.listenerCount === 0) this.close()
  }

  close() {
    this.closed = true
    if (this.retry) clearTimeout(this.retry)
    this.retry = null

    const socket = this.socket
    this.socket = null
    socket?.close(1000, 'client closed')
  }

  private add<K extends keyof Events & string>(
    event: K,
    listener: Listener<Events[K]>,
    once: boolean,
  ) {
    const wrapped = ((data: Events[K]) => {
      if (once) this.off(event, wrapped as Listener<Events[K]>)
      listener(data)
    }) as Listener<Events[K]>

    const existing = this.listeners.get(event)
    if (existing) existing.add(wrapped as Listener<never>)
    else this.listeners.set(event, new Set([wrapped as Listener<never>]))

    this.open()

    return () => this.off(event, wrapped as Listener<Events[K]>)
  }

  private open() {
    if (this.socket || this.closed) return

    let socket: WebSocketLike
    try {
      socket = this.createSocket!(this.url, this.headers)
    } catch (error) {
      console.error('[aegis] could not open the event socket', error)
      this.scheduleRetry()
      return
    }

    this.socket = socket

    socket.addEventListener('message', (event) => {
      this.receive(String(event.data))
    })

    socket.addEventListener('close', () => {
      this.socket = null
      // Only reconnect while someone is still listening.
      if (!this.closed && this.listenerCount > 0) this.scheduleRetry()
    })
  }

  private scheduleRetry() {
    if (this.retry || this.closed) return
    this.retry = setTimeout(() => {
      this.retry = null
      this.open()
    }, RETRY_MS)
  }

  private receive(raw: string) {
    let message: unknown
    try {
      message = JSON.parse(raw)
    } catch {
      console.warn('[aegis] the event socket sent a non-JSON message')
      return
    }

    if (typeof message !== 'object' || message === null) return
    const payload = message as Record<string, unknown>
    const type = payload['type']
    // `ready` and `ping` are transport, not something a caller subscribed to.
    if (typeof type !== 'string' || type === 'ready' || type === 'ping') return

    const set = this.listeners.get(type)
    if (!set) return

    for (const listener of [...set]) {
      try {
        ;(listener as Listener<unknown>)(payload)
      } catch (error) {
        console.error(`[aegis] a ${type} listener threw`, error)
      }
    }
  }
}
