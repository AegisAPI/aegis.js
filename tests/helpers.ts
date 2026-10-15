import { expect } from 'bun:test'

export type Call = { url: string; init: RequestInit }

export type Responder = (
  url: string,
  init: RequestInit,
) => Response | Promise<Response>

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/** The `{ data }` envelope every successful Aegis route answers. */
export function data(body: unknown): Response {
  return json({ data: body })
}

export function errorEnvelope(
  code: string,
  message: string,
  requestId?: string,
): Response {
  return json({ error: { code, message }, requestId }, 400)
}

/**
 * A fetch stand-in that records what it was called with. Defaults to a plain
 * `{ data: { ok: true } }` so a test only overrides the part it cares about.
 */
export function stubFetch(responder?: Responder) {
  const calls: Call[] = []

  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} })
    return responder
      ? await responder(String(input), init ?? {})
      : data({ ok: true })
  }

  return { calls, fetch: fetch as unknown as typeof globalThis.fetch }
}

export function headersOf(call: Call): Record<string, string> {
  return (call.init.headers ?? {}) as Record<string, string>
}

export function lastCall(calls: Call[]): Call {
  const call = calls.at(-1)
  expect(call).toBeDefined()
  return call!
}
