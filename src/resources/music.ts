import { Resource } from './base.js'
import { EventSocket, type SocketOptions } from '../socket.js'
import type { Http } from '../http.js'
import type { MusicEventMap, MusicEventName } from './music-events.js'
import type { JsonBodyOf, Operation } from '../types.js'

const PLAY = '/v1/music/guilds/{guildId}/play' as const
const PAUSE = '/v1/music/guilds/{guildId}/pause' as const
const RESUME = '/v1/music/guilds/{guildId}/resume' as const
const SKIP = '/v1/music/guilds/{guildId}/skip' as const
const GUILD = '/v1/music/guilds/{guildId}' as const
const QUEUE = '/v1/music/guilds/{guildId}/queue' as const
const QUEUE_ENTRY = '/v1/music/guilds/{guildId}/queue/{index}' as const
const VOLUME = '/v1/music/guilds/{guildId}/volume' as const
const MUTE = '/v1/music/guilds/{guildId}/mute' as const
const SEEK = '/v1/music/guilds/{guildId}/seek' as const
const SHUFFLE = '/v1/music/guilds/{guildId}/shuffle' as const
const RESTART = '/v1/music/guilds/{guildId}/restart' as const
const LOOP = '/v1/music/guilds/{guildId}/loop' as const

export type PlayBody = JsonBodyOf<Operation<typeof PLAY, 'post'>>
export type SeekBody = JsonBodyOf<Operation<typeof SEEK, 'post'>>
export type VolumeBody = JsonBodyOf<Operation<typeof VOLUME, 'patch'>>
export type MuteBody = JsonBodyOf<Operation<typeof MUTE, 'post'>>
export type LoopBody = JsonBodyOf<Operation<typeof LOOP, 'put'>>
export type MoveBody = JsonBodyOf<Operation<typeof QUEUE_ENTRY, 'patch'>>

export class MusicResource extends Resource {
  private readonly socket: EventSocket<MusicEventMap>

  constructor(http: Http, options: SocketOptions = {}) {
    super(http)
    this.socket = new EventSocket<MusicEventMap>(options)
  }

  /** True while the event socket is open, which is only after a listener. */
  get listening(): boolean {
    return this.socket.connected
  }

  /**
   * Subscribes to a music event, opening the socket on the first listener.
   * Returns a function that unsubscribes.
   */
  on<K extends MusicEventName>(
    event: K,
    listener: (data: MusicEventMap[K]) => void,
  ) {
    return this.socket.on(event, listener)
  }

  once<K extends MusicEventName>(
    event: K,
    listener: (data: MusicEventMap[K]) => void,
  ) {
    return this.socket.once(event, listener)
  }

  off<K extends MusicEventName>(
    event: K,
    listener: (data: MusicEventMap[K]) => void,
  ) {
    this.socket.off(event, listener)
  }

  /** Closes the socket. A later `on` will not reopen it. */
  disconnect() {
    this.socket.close()
  }
  play(guildId: string, body: PlayBody) {
    return this.call('post', PLAY, { params: { guildId }, body })
  }

  pause(guildId: string) {
    return this.call('post', PAUSE, { params: { guildId } })
  }

  resume(guildId: string) {
    return this.call('post', RESUME, { params: { guildId } })
  }

  skip(guildId: string) {
    return this.call('post', SKIP, { params: { guildId } })
  }

  stop(guildId: string) {
    return this.call('delete', GUILD, { params: { guildId } })
  }

  queue(guildId: string) {
    return this.call('get', QUEUE, { params: { guildId } })
  }

  clearQueue(guildId: string) {
    return this.call('delete', QUEUE, { params: { guildId } })
  }

  volume(guildId: string) {
    return this.call('get', VOLUME, { params: { guildId } })
  }

  setVolume(guildId: string, body: VolumeBody) {
    return this.call('patch', VOLUME, { params: { guildId }, body })
  }

  mute(guildId: string, body?: MuteBody) {
    return this.call('post', MUTE, { params: { guildId }, body })
  }

  unmute(guildId: string) {
    return this.call('delete', MUTE, { params: { guildId } })
  }

  seek(guildId: string, body: SeekBody) {
    return this.call('post', SEEK, { params: { guildId }, body })
  }

  shuffle(guildId: string) {
    return this.call('post', SHUFFLE, { params: { guildId } })
  }

  restart(guildId: string) {
    return this.call('post', RESTART, { params: { guildId } })
  }

  loop(guildId: string) {
    return this.call('get', LOOP, { params: { guildId } })
  }

  setLoop(guildId: string, body: LoopBody) {
    return this.call('put', LOOP, { params: { guildId }, body })
  }

  removeFromQueue(guildId: string, index: number) {
    return this.call('delete', QUEUE_ENTRY, { params: { guildId, index } })
  }

  moveInQueue(guildId: string, index: number, body: MoveBody) {
    return this.call('patch', QUEUE_ENTRY, {
      params: { guildId, index },
      body,
    })
  }
}
