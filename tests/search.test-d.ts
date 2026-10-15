import { Aegis, MUSIC_SEARCH_PROVIDERS } from '../src/index.js'
import type { MusicSearchProvider, SearchQuery } from '../src/index.js'

const aegis = new Aegis({ apiKey: 'k' })

await aegis.music.play('123', { query: 'lofi' })
await aegis.music.play('123', { query: 'lofi', channelId: '456' })
await aegis.music.play('123', { track: { encoded: 'QAAA...' } })
await aegis.music.play('123', {
  track: { encoded: 'QAAA...' },
  channelId: '456',
})

await aegis.music.search({ query: 'rick astley' })
await aegis.music.search({ query: 'x', limit: 10 })
await aegis.music.search({ query: 'x', provider: 'youtube' })
await aegis.music.search({ query: 'x', provider: 'spotify' })

const params: SearchQuery = { query: 'y' }
await aegis.music.search(params)

const providers: readonly MusicSearchProvider[] = MUSIC_SEARCH_PROVIDERS
for (const provider of providers) {
  await aegis.music.search({ query: 'x', provider })
}

// @ts-expect-error precisa de query ou track
await aegis.music.play('123', {})

// @ts-expect-error channelId sozinho nao basta
await aegis.music.play('123', { channelId: '456' })

// @ts-expect-error campo desconhecido
await aegis.music.play('123', { nada: true })

// @ts-expect-error search exige query
await aegis.music.search({})

// @ts-expect-error provider fora da lista
await aegis.music.search({ query: 'x', provider: 'deezer' })

const found = await aegis.music.search({ query: 'x' })
const first = found.results[0]
if (first) {
  const encoded: string = first.encoded
  await aegis.music.play('123', { track: { encoded } })
}

export { providers }
