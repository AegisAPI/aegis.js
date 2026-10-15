import { describe, expect, it } from 'bun:test'
import { Aegis } from '../src/client.js'
import { DEFAULT_BASE_URL } from '../src/http.js'
import { AegisError } from '../src/errors.js'
import {
  data,
  errorEnvelope,
  headersOf,
  json,
  lastCall,
  stubFetch,
  type Responder,
} from './helpers.js'

const make = (responder?: Responder) => {
  const stub = stubFetch(responder)
  const aegis = new Aegis({
    apiKey: 'aegis.key',
    baseUrl: 'http://api.test',
    fetch: stub.fetch,
  })
  return { aegis, ...stub }
}

describe('defaults', () => {
  it('targets the production host when no baseUrl is given', async () => {
    const stub = stubFetch()
    const aegis = new Aegis({ apiKey: 'aegis.key', fetch: stub.fetch })

    await aegis.request('get', '/v1/status')

    expect(lastCall(stub.calls).url).toBe(`${DEFAULT_BASE_URL}/v1/status`)
  })

  it('refuses to build without an apiKey or a baseUrl', () => {
    expect(() => new Aegis({})).toThrow(AegisError)
  })
})

describe('url building', () => {
  it('fills and encodes path parameters', async () => {
    const { aegis, calls } = make()
    await aegis.request('get', '/v1/music/guilds/{guildId}/queue', {
      params: { guildId: '123/456' },
    })

    expect(lastCall(calls).url).toBe(
      'http://api.test/v1/music/guilds/123%2F456/queue',
    )
  })

  it('only sends the query parameters it was given', async () => {
    const { aegis, calls } = make()
    await aegis.request('get', '/v1/minecraft/render/{player}', {
      params: { player: 'Notch' },
      // `null` is not in the spec's query type, but the transport drops it too.
      query: { render: 'wave', scale: undefined, skinUrl: null } as never,
    })

    expect(lastCall(calls).url).toBe(
      'http://api.test/v1/minecraft/render/Notch?render=wave',
    )
  })

  it('repeats the key for an array query parameter', async () => {
    const { aegis, calls } = make()
    await aegis.request('get', '/v1/status', {
      query: { tag: ['a', 'b'] } as never,
    })

    expect(lastCall(calls).url).toBe('http://api.test/v1/status?tag=a&tag=b')
  })

  it('throws before calling fetch when a path parameter is missing', async () => {
    const { aegis, calls } = make()

    expect(() =>
      aegis.request('get', '/v1/music/guilds/{guildId}/queue', {
        params: { guildId: undefined as unknown as string },
      }),
    ).toThrow(/Missing path parameter "guildId"/)

    expect(calls).toHaveLength(0)
  })
})

describe('headers and body', () => {
  it('sends the api key as a bearer token', async () => {
    const { aegis, calls } = make()
    await aegis.request('get', '/v1/status')

    expect(headersOf(lastCall(calls))['authorization']).toBe('Bearer aegis.key')
  })

  it('omits the authorization header when there is no key', async () => {
    const stub = stubFetch()
    const aegis = new Aegis({ baseUrl: 'http://api.test', fetch: stub.fetch })

    await aegis.request('get', '/v1/status')

    expect(headersOf(lastCall(stub.calls))['authorization']).toBeUndefined()
  })

  it('serialises the body as json', async () => {
    const { aegis, calls } = make()
    await aegis.request('post', '/v1/music/guilds/{guildId}/play', {
      params: { guildId: '123' },
      body: { query: 'lofi' },
    })

    const call = lastCall(calls)
    expect(call.init.method).toBe('POST')
    expect(headersOf(call)['content-type']).toBe('application/json')
    expect(call.init.body).toBe('{"query":"lofi"}')
  })

  it('sends no body or content-type when there is none', async () => {
    const { aegis, calls } = make()
    await aegis.request('get', '/v1/status')

    const call = lastCall(calls)
    expect(call.init.body).toBeUndefined()
    expect(headersOf(call)['content-type']).toBeUndefined()
  })
})

describe('responses', () => {
  const status = {
    status: 'ok',
    timestamp: '2026-01-01T00:00:00.000Z',
    uptime: 1,
    version: '0.1.0',
    environment: 'production',
  } as const

  it('unwraps the data envelope', async () => {
    const { aegis } = make(() => data(status))
    expect(await aegis.request('get', '/v1/status')).toEqual(status)
  })

  it('returns the body untouched when it has no data field', async () => {
    const { aegis } = make(() => json({ nothing: true }))
    const result = (await aegis.request('get', '/v1/status')) as unknown

    expect(result).toEqual({ nothing: true })
  })

  it('handles an empty body', async () => {
    const { aegis } = make(() => new Response(null, { status: 204 }))
    expect(await aegis.request('get', '/v1/status')).toBeUndefined()
  })

  it('survives a body that is not json', async () => {
    const { aegis } = make(() => new Response('not json', { status: 200 }))
    const result = (await aegis.request('get', '/v1/status')) as unknown

    expect(result).toBe('not json')
  })
})

describe('errors', () => {
  it('maps the error envelope onto AegisError', async () => {
    const { aegis } = make(() =>
      errorEnvelope('bad_request', 'That position is past the end.', 'req-7'),
    )

    const error = await aegis
      .request('get', '/v1/status')
      .catch((thrown: unknown) => thrown)

    expect(error).toBeInstanceOf(AegisError)
    expect(error).toMatchObject({
      message: 'That position is past the end.',
      code: 'bad_request',
      status: 400,
      requestId: 'req-7',
    })
  })

  it('falls back when the error body is not the envelope', async () => {
    const { aegis } = make(() => new Response('nope', { status: 502 }))

    const error = await aegis
      .request('get', '/v1/status')
      .catch((thrown: unknown) => thrown)

    expect(error).toBeInstanceOf(AegisError)
    expect(error).toMatchObject({
      message: 'Aegis answered 502.',
      code: 'internal_error',
      status: 502,
    })
  })

  it('wraps a transport failure as status 0', async () => {
    const { aegis } = make(() => {
      throw new TypeError('fetch failed')
    })

    const error = await aegis
      .request('get', '/v1/status')
      .catch((thrown: unknown) => thrown)

    expect(error).toBeInstanceOf(AegisError)
    expect(error).toMatchObject({ status: 0, code: 'service_unavailable' })
  })
})
