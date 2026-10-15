import { AegisError } from './errors.js'

export const DEFAULT_BASE_URL = 'https://api.aegi.run'
export const DEFAULT_TIMEOUT_MS = 30_000

export interface HttpOptions {
  baseUrl?: string
  apiKey?: string
  timeoutMs?: number
  fetch?: typeof globalThis.fetch
  userAgent?: string
}

export interface SendOptions {
  params?: Record<string, unknown>
  query?: Record<string, unknown>
  body?: unknown
}

const PLACEHOLDER = /\{(\w+)\}/g

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function buildUrl(
  base: string,
  path: string,
  params?: Record<string, unknown>,
  query?: Record<string, unknown>,
): string {
  const filled = path.replace(PLACEHOLDER, (_match, key: string) => {
    const value = params?.[key]
    if (value === undefined || value === null) {
      throw new AegisError(`Missing path parameter "${key}" for ${path}.`, {
        status: 0,
        code: 'bad_request',
      })
    }
    return encodeURIComponent(String(value))
  })

  const url = new URL(filled, base)

  if (isRecord(query)) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, String(item))
        continue
      }
      url.searchParams.append(key, String(value))
    }
  }

  return url.toString()
}

/** Untyped on purpose: the generic surface lives on `Aegis`. */
export class Http {
  private readonly base: string
  private readonly apiKey: string | undefined
  private readonly timeoutMs: number
  private readonly fetchImpl: typeof globalThis.fetch
  private readonly userAgent: string

  constructor(options: HttpOptions = {}) {
    this.base = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')
    this.apiKey = options.apiKey
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.fetchImpl = options.fetch ?? globalThis.fetch
    this.userAgent = options.userAgent ?? 'aegis.js'
  }

  async send(
    method: string,
    path: string,
    options: SendOptions = {},
  ): Promise<unknown> {
    const url = buildUrl(this.base, path, options.params, options.query)

    const headers: Record<string, string> = {
      accept: 'application/json',
      'user-agent': this.userAgent,
    }
    if (this.apiKey) headers['authorization'] = `Bearer ${this.apiKey}`

    const init: RequestInit = {
      method: method.toUpperCase(),
      headers,
      signal: AbortSignal.timeout(this.timeoutMs),
    }

    if (options.body !== undefined) {
      headers['content-type'] = 'application/json'
      init.body = JSON.stringify(options.body)
    }

    let response: Response
    try {
      response = await this.fetchImpl(url, init)
    } catch (error) {
      throw new AegisError(
        error instanceof Error ? error.message : 'The request failed.',
        { status: 0, code: 'service_unavailable' },
      )
    }

    const raw = await response.text()
    let parsed: unknown
    if (raw.length > 0) {
      try {
        parsed = JSON.parse(raw)
      } catch {
        parsed = raw
      }
    }

    if (!response.ok) throw toError(response, parsed)

    return unwrap(parsed)
  }
}

function toError(response: Response, parsed: unknown): AegisError {
  const envelope = isRecord(parsed) ? parsed : {}
  const error = isRecord(envelope['error']) ? envelope['error'] : undefined
  const requestId =
    typeof envelope['requestId'] === 'string'
      ? envelope['requestId']
      : undefined

  return new AegisError(
    typeof error?.['message'] === 'string'
      ? error['message']
      : `Aegis answered ${response.status}.`,
    {
      status: response.status,
      code:
        typeof error?.['code'] === 'string' ? error['code'] : 'internal_error',
      requestId,
      body: parsed,
    },
  )
}

/** The API answers `{ data }` on success, so callers get the inner value. */
function unwrap(parsed: unknown): unknown {
  if (isRecord(parsed) && 'data' in parsed) return parsed['data']
  return parsed
}
