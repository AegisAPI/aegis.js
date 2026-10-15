import { describe, expect, it } from 'bun:test'
import { Aegis } from '../src/index.js'
import type { MusicEventMap } from '../src/index.js'

type Socket = {
  url: string
  headers: Record<string, string>
  handlers: Record<string, (event: any) => void>
  sent: string[]
  closed: boolean
  send(data: string): void
  close(): void
  readyState: number
  addEventListener(type: string, handler: (event: any) => void): void
}

function stubSocket() {
  const made: Socket[] = []

  const createSocket = (url: string, headers: Record<string, string>) => {
    const socket: Socket = {
      url,
      headers,
      handlers: {},
      sent: [],
      closed: false,
      send(data: string) {
        socket.sent.push(data)
      },
      close() {
        socket.closed = true
      },
      readyState: 1,
      addEventListener(type: string, handler: (event: any) => void) {
        socket.handlers[type] = handler
      },
    }
    made.push(socket)
    return socket as never
  }

  return { made, createSocket, last: () => made[made.length - 1]! }
}

const make = () => {
  const stub = stubSocket()
  const aegis = new Aegis({
    apiKey: 'aegis.key',
    baseUrl: 'https://api.test',
    createSocket: stub.createSocket,
  } as never)
  return { aegis, ...stub }
}

const event = (data: Record<string, unknown>) =>
  ({ data: JSON.stringify(data) }) as never

describe('lazy connection', () => {
  it('does not open a socket until something subscribes', () => {
    const { aegis, made } = make()

    expect(made).toHaveLength(0)
    expect(aegis.music.listening).toBe(false)

    aegis.music.on('trackStarted', () => {})
    expect(made).toHaveLength(1)
    expect(aegis.music.listening).toBe(true)
  })

  it('derives a wss url and sends the key as a header', () => {
    const { aegis, last } = make()
    aegis.music.on('trackEnded', () => {})

    expect(last().url).toBe('wss://api.test/v1/events')
    expect(last().headers['authorization']).toBe('Bearer aegis.key')
  })

  it('uses ws for an http base url', () => {
    const stub = stubSocket()
    const aegis = new Aegis({
      apiKey: 'k',
      baseUrl: 'http://localhost:3000',
      createSocket: stub.createSocket,
    } as never)

    aegis.music.on('trackStarted', () => {})
    expect(stub.last().url).toBe('ws://localhost:3000/v1/events')
  })
})

describe('dispatch', () => {
  it('delivers only the subscribed event', () => {
    const { aegis, last } = make()
    const seen: string[] = []

    aegis.music.on('trackStarted', () => seen.push('started'))
    aegis.music.on('trackEnded', () => seen.push('ended'))

    last().handlers['message']!(event({ type: 'trackStarted', guildId: '1' }))
    expect(seen).toEqual(['started'])

    last().handlers['message']!(event({ type: 'trackEnded', guildId: '1' }))
    expect(seen).toEqual(['started', 'ended'])
  })

  it('passes the whole payload through', () => {
    const { aegis, last } = make()
    let received: unknown

    aegis.music.on('trackStarted', (data) => {
      received = data
    })

    const payload = {
      type: 'trackStarted',
      botId: 'b1',
      guildId: 'g1',
      track: {
        title: 'Song',
        author: 'Band',
        lengthMs: 1,
        uri: null,
        artworkUrl: null,
        isStream: false,
      },
    }
    last().handlers['message']!(event(payload))

    expect(received).toEqual(payload)
  })

  it('ignores transport frames and unknown events', () => {
    const { aegis, last } = make()
    const seen: string[] = []
    aegis.music.on('trackStarted', () => seen.push('x'))

    last().handlers['message']!(
      event({ type: 'ready', botId: null, events: [] }),
    )
    last().handlers['message']!(event({ type: 'ping' }))
    last().handlers['message']!(event({ type: 'somethingElse' }))

    expect(seen).toEqual([])
  })

  it('survives a non-JSON frame', () => {
    const { aegis, last } = make()
    const seen: string[] = []
    aegis.music.on('trackStarted', () => seen.push('x'))

    expect(() =>
      last().handlers['message']!({ data: 'not json' } as never),
    ).not.toThrow()
    expect(seen).toEqual([])
  })

  it('keeps going when one listener throws', () => {
    const { aegis, last } = make()
    const seen: string[] = []

    aegis.music.on('trackStarted', () => {
      throw new Error('boom')
    })
    aegis.music.on('trackStarted', () => seen.push('second'))

    last().handlers['message']!(event({ type: 'trackStarted' }))
    expect(seen).toEqual(['second'])
  })
})

describe('unsubscribing', () => {
  it('once fires a single time', () => {
    const { aegis, last } = make()
    const seen: string[] = []

    aegis.music.once('trackEnded', () => seen.push('x'))
    last().handlers['message']!(event({ type: 'trackEnded' }))
    last().handlers['message']!(event({ type: 'trackEnded' }))

    expect(seen).toEqual(['x'])
  })

  it('the returned function unsubscribes', () => {
    const { aegis, last } = make()
    const seen: string[] = []

    const off = aegis.music.on('trackEnded', () => seen.push('x'))
    off()
    last().handlers['message']!(event({ type: 'trackEnded' }))

    expect(seen).toEqual([])
  })

  it('closes the socket once the last listener goes', () => {
    const { aegis, last } = make()
    const off = aegis.music.on('trackEnded', () => {})

    expect(last().closed).toBe(false)
    off()
    expect(last().closed).toBe(true)
    expect(aegis.music.listening).toBe(false)
  })

  it('keeps the socket while another listener remains', () => {
    const { aegis, last } = make()
    const off = aegis.music.on('trackEnded', () => {})
    aegis.music.on('trackStarted', () => {})

    off()
    expect(last().closed).toBe(false)
    expect(aegis.music.listening).toBe(true)
  })
})

describe('event map', () => {
  it('types each listener payload', () => {
    const aegis = new Aegis({ apiKey: 'k' })
    const typed: (data: MusicEventMap['trackStarted']) => void = (data) => {
      const title: string = data.track.title
      const guild: string = data.guildId
      void title
      void guild
    }
    aegis.music.on('trackStarted', typed)

    // @ts-expect-error queueEmptied has no `track`
    aegis.music.on('queueEmptied', (data) => void data.track)

    // @ts-expect-error not an event name
    aegis.music.on('nope', () => {})
  })
})
