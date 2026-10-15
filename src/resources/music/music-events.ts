/** Mirrors the track shape the API sends over the socket. */
export type MusicEventTrack = {
  title: string
  author: string
  lengthMs: number
  uri: string | null
  artworkUrl: string | null
  isStream: boolean
}

/** One event a socket can deliver, as the API names it. */
export type MusicEventMap = {
  trackStarted: {
    type: 'trackStarted'
    botId: string
    guildId: string
    track: MusicEventTrack
  }
  trackEnded: {
    type: 'trackEnded'
    botId: string
    guildId: string
    reason: string
  }
  queueEmptied: { type: 'queueEmptied'; botId: string; guildId: string }
  playerClosed: {
    type: 'playerClosed'
    botId: string
    guildId: string
    reason: 'idle' | 'disconnected'
  }
  botStopped: { type: 'botStopped'; botId: string; reason: string }
}

export type MusicEventName = keyof MusicEventMap

export const MUSIC_EVENTS: MusicEventName[] = [
  'trackStarted',
  'trackEnded',
  'queueEmptied',
  'playerClosed',
  'botStopped',
]
