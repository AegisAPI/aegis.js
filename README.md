# aegis.js

[![CI](https://github.com/AegisAPI/aegis.js/actions/workflows/ci.yml/badge.svg)](https://github.com/AegisAPI/aegis.js/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/aegis.js)](https://www.npmjs.com/package/aegis.js)

The official TypeScript client for the [Aegis](https://aegi.run) API: music, images, games and utilities for a Discord bot, so you do not have to build any of it yourself.

Every route, parameter, body and response is typed from the API's OpenAPI document. Successful responses arrive already unwrapped, and anything the API rejects arrives as an `AegisError`.

- Typed methods for all 38 `/v1` routes.
- Zero runtime dependencies.
- ESM only, ships type declarations.
- A typed WebSocket client for the music events.

## Install

```sh
npm install aegis.js
```

Needs a runtime with a global `fetch` (Node 18+). The event socket also needs a global `WebSocket` (Node 22+), unless you supply your own.

## Quick start

```ts
import { Aegis } from 'aegis.js'

const aegis = new Aegis({ apiKey: process.env.AEGIS_API_KEY })

// Play whatever the query finds, joining the caller's channel.
const { track, position } = await aegis.music.play(guildId, {
  query: 'lofi hip hop',
  channelId: voiceChannelId,
})

// Search first, then play exactly what was picked.
const found = await aegis.music.search({ query: 'rick astley', limit: 5 })
const chosen = found.results[0]!
await aegis.music.play(guildId, { track: { encoded: chosen.encoded } })

// Read the player: what is playing, where playback is, and the queue.
const state = await aegis.music.queue(guildId)
console.log(state.current?.title, state.volume, state.loop)
```

## API key

Create a key on [aegi.run](https://aegi.run) and pass it as `apiKey`. It is sent as `Authorization: Bearer <key>` on every request, and as a header on the event socket handshake.

`apiKey` and `baseUrl` cannot both be omitted. Constructing a client with neither throws right away instead of failing on the first call.

## Options

Every option goes to the constructor.

| Option         | Type                              | Default                | Notes                                                  |
| -------------- | --------------------------------- | ---------------------- | ------------------------------------------------------ |
| `apiKey`       | `string`                          | `undefined`            | Sent as a bearer token.                                |
| `baseUrl`      | `string`                          | `https://api.aegi.run` | Trailing slashes are trimmed.                          |
| `timeoutMs`    | `number`                          | `30000`                | Per request, via `AbortSignal.timeout`.                |
| `fetch`        | `typeof globalThis.fetch`         | `globalThis.fetch`     | Inject your own for tests, proxies or instrumentation. |
| `userAgent`    | `string`                          | `aegis.js`             |                                                        |
| `createSocket` | `(url, headers) => WebSocketLike` | global `WebSocket`     | Inject a socket implementation.                        |

## Resources

Resources hang off the client, grouped the way the API groups them.

- `aegis.music`: `search` `play` `pause` `resume` `skip` `stop` `queue` `clearQueue` `volume` `setVolume` `mute` `unmute` `seek` `shuffle` `restart` `loop` `setLoop` `removeFromQueue` `moveInQueue`
- `aegis.minecraft`: `info` `textures` `render`
- `aegis.jobs`: `get` `wait`
- `aegis.bible`: `languages` `types` `translations` `books` `chapter` `search` `verses` `data`
- `aegis.binary`: `encode` `decode`
- `aegis.translation`: `translate` `detect` `languages`
- `aegis.roblox`: `user` `game`
- `aegis.holidays`: `next` `year`
- `aegis.fun`: `roleplay`
- `aegis.general`: `status`

A few of them in full:

```ts
await aegis.music.setVolume(guildId, { volume: 40, muted: true }) // 100 is default, 200 the highest
await aegis.music.seek(guildId, { position: 30_000 })
await aegis.music.setLoop(guildId, { mode: 'queue' }) // 'off' | 'track' | 'queue'
await aegis.music.moveInQueue(guildId, 3, { to: 0 })

await aegis.translation.translate({ text: 'hello', to: 'pt' })
await aegis.bible.verses('bbe', { refs: 'John 3:16' })
await aegis.holidays.next('BR')
await aegis.roblox.game(107778070777162)
await aegis.binary.encode({ text: 'hello' })
await aegis.fun.roleplay({ type: 'hug' })
```

### Jobs

Routes that queue work answer with a job instead of a result. Renders are the common case.

```ts
const queued = await aegis.minecraft.render('Notch', {
  render: 'wave',
  scale: 4,
})

// Poll it...
const job = await aegis.jobs.get(queued.jobId)

// ...or hold the request open until it reaches a final state.
const finished = await aegis.jobs.wait(queued.jobId, { timeout: 60 })
if (finished.status === 'completed') console.log(finished.result)
```

## Events

`aegis.music` also exposes the event socket, typed per event name.

```ts
const off = aegis.music.on('trackStarted', (event) => {
  console.log(`${event.track.title} in ${event.guildId}`)
})

aegis.music.once('trackEnded', (event) => console.log(event.reason))

off() // the return value unsubscribes
```

| Event          | Payload                                                   |
| -------------- | --------------------------------------------------------- |
| `trackStarted` | `botId` `guildId` `track`                                 |
| `trackEnded`   | `botId` `guildId` `reason`                                |
| `queueEmptied` | `botId` `guildId`                                         |
| `playerClosed` | `botId` `guildId` `reason` (`'idle'` or `'disconnected'`) |
| `botStopped`   | `botId` `reason`                                          |

`MUSIC_EVENTS` lists the same names as a runtime value.

How the socket behaves:

- It opens on the first listener and closes when the last one unsubscribes, so a bot that never listens never holds a connection.
- It reconnects 5 seconds after an unexpected close, as long as someone is still listening.
- `ready` and `ping` frames, and events nobody subscribed to, are ignored.
- A listener that throws is logged; the others still run.

`aegis.music.listening` reports whether the socket is open. `aegis.music.disconnect()` closes it for good.

## Errors

Every non-2xx answer, and any request that never left the machine, throws an `AegisError`.

```ts
import { AegisError } from 'aegis.js'

try {
  await aegis.music.play(guildId, { query: 'lofi' })
} catch (error) {
  if (error instanceof AegisError) {
    error.status // 403
    error.code // 'forbidden'
    error.requestId // quote this when asking for help
    error.body // the parsed error envelope
  }
}
```

## Any route, by path

Routes without a named method are still reachable, and still typed.

```ts
const status = await aegis.request('get', '/v1/status')
//    ^? the exact shape the API documents

await aegis.request('post', '/v1/music/guilds/{guildId}/play', {
  params: { guildId },
  body: { query: 'lofi' },
})

// @ts-expect-error /v1/status takes no query
await aegis.request('get', '/v1/status', { query: { a: 1 } })

// @ts-expect-error /v1/status has no patch
await aegis.request('patch', '/v1/status')
```

## Types

The response shapes are re-exported under readable names, so you rarely need to reach into the schema namespace.

```ts
import type {
  Job,
  PlayerState,
  PlayResult,
  Track,
  components,
  PathKey,
  Paths,
  RequestOptions,
  Result,
} from 'aegis.js'
```

`components` is the whole OpenAPI `components` namespace, so any schema in the document is reachable from there.

## Development

```sh
git clone https://github.com/AegisAPI/aegis.js
cd aegis.js
bun install

bun test # unit tests
bun run typecheck # tsc --noEmit
bun run build # emit dist/ with type declarations
bun run format # prettier
bun run schema:build # regenerate src/generated/schema.ts from the live spec
```

`schema:build` rewrites the generated types from `https://api.aegi.run/openapi.json`, so route types follow the API rather than this repository. After regenerating, run typecheck: a path or field the API renamed shows up there first.

CI runs typecheck, tests, build and the format check on every push and pull request.

## Contributing

Keep a pull request focused on one thing, and leave `bun run typecheck`, `bun test` and `bun run format:check` green.

## License

[MIT](./LICENSE) © 2026 Mubi
