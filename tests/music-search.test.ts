import { describe, expect, it } from 'bun:test'
import { Aegis } from '../src/index.js'
import { data, lastCall, stubFetch, type Responder } from './helpers.js'

const make = (responder?: Responder) => {
  const stub = stubFetch(responder)
  const aegis = new Aegis({
    apiKey: 'aegis.key',
    baseUrl: 'http://api.test',
    fetch: stub.fetch,
  })
  return { aegis, ...stub }
}

const track = (title: string, encoded = `enc-${title}`) => ({
  title,
  author: 'Band',
  lengthMs: 1000,
  uri: null,
  artworkUrl: null,
  isStream: false,
  encoded,
})

const results = (...titles: string[]) =>
  data({ results: titles.map((title) => track(title)) })

describe('music.search', () => {
  it('sends the query', async () => {
    const { aegis, calls } = make()
    await aegis.music.search({ query: 'rick astley' })

    const call = lastCall(calls)
    expect(call.init.method).toBe('GET')
    expect(call.url).toBe('http://api.test/v1/music/search?query=rick+astley')
  })

  it('sends an explicit limit', async () => {
    const { aegis, calls } = make()
    await aegis.music.search({ query: 'x', limit: 3 })

    expect(lastCall(calls).url).toContain('limit=3')
  })

  it('sends each provider', async () => {
    for (const provider of ['youtube', 'spotify'] as const) {
      const { aegis, calls } = make()
      await aegis.music.search({ query: 'x', provider })
      expect(lastCall(calls).url).toContain(`provider=${provider}`)
    }
  })

  it('unwraps the results', async () => {
    const { aegis } = make(() => results('A', 'B'))
    const found = await aegis.music.search({ query: 'x' })

    expect(found.results).toHaveLength(2)
    expect(found.results[0]?.encoded).toBe('enc-A')
  })

  it('feeds a result straight back into play', async () => {
    const { aegis, calls } = make(() =>
      data({ results: [track('Escolhida', 'QAAA-1')] }),
    )

    const found = await aegis.music.search({ query: 'x' })
    const chosen = found.results[0]!
    await aegis.music.play('123', { track: { encoded: chosen.encoded } })

    const call = lastCall(calls)
    expect(call.url).toBe('http://api.test/v1/music/guilds/123/play')
    expect(call.init.body).toBe('{"track":{"encoded":"QAAA-1"}}')
  })
})
