/**
 * Compile-time only. `@ts-expect-error` on a line that stops erroring fails the
 * build, so this catches the type regressions `tsc` would otherwise miss.
 */
import { Aegis } from '../src/index.js'
import type { PlayerState, Track } from '../src/index.js'

const aegis = new Aegis({ apiKey: `aegis.${'0'.repeat(64)}` })

const state: PlayerState = await aegis.music.queue('123')
const channelId: string = state.channelId
const volume: number = state.volume
const current: Track | null = state.current

await aegis.music.play('123', { query: 'lofi' })
await aegis.music.setVolume('123', { volume: 50 })
await aegis.music.seek('123', { position: 30_000 })
await aegis.music.setLoop('123', { mode: 'queue' })
await aegis.music.moveInQueue('123', 0, { to: 2 })

await aegis.minecraft.render('Notch')
await aegis.minecraft.render('Notch', { render: 'wave', scale: 2 })

await aegis.request('get', '/v1/status')

// @ts-expect-error `play` needs a body
await aegis.music.play('123')

// @ts-expect-error unknown query field
await aegis.minecraft.render('Notch', { nope: 1 })

// @ts-expect-error `/v1/status` takes no query
await aegis.request('get', '/v1/status', { query: { a: 1 } })

// @ts-expect-error `queue` needs a guildId
await aegis.music.queue()

// @ts-expect-error `/v1/status` has no `patch`
await aegis.request('patch', '/v1/status')

export { channelId, volume, current }
