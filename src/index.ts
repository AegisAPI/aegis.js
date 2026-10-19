export { Aegis, type AegisOptions } from './client.js'
export { AegisError, type ApiErrorCode, type ErrorResponse } from './errors.js'
export { Http, type HttpOptions, DEFAULT_BASE_URL } from './http.js'
export { EventSocket, type SocketOptions } from './socket.js'
export * from './resources/index.js'
export type {
  HttpMethod,
  JsonBodyOf,
  MethodOf,
  Operation,
  PathKey,
  Paths,
  QueryOf,
  RequestOptions,
  Result,
} from './types.js'
import type { components } from './generated/schema.js'
export type { components }

/** Named response shapes, so callers do not have to reach into `components`. */
export type Track = components['schemas']['Track']
export type EncodedTrack = components['schemas']['EncodedTrack']
export type MusicNode = components['schemas']['MusicNode']
export type PlayerInfo = components['schemas']['PlayerInfo']
export type PlayerState = components['schemas']['PlayerState']
export type PlayResult = components['schemas']['PlayResult']
export type PausedResult = components['schemas']['PausedResult']
export type SkipResult = components['schemas']['SkipResult']
export type OkResult = components['schemas']['OkResult']
export type VolumeResult = components['schemas']['VolumeResult']
export type MuteResult = components['schemas']['MuteResult']
export type SeekResult = components['schemas']['SeekResult']
export type ShuffleResult = components['schemas']['ShuffleResult']
export type ClearQueueResult = components['schemas']['ClearQueueResult']
export type RestartResult = components['schemas']['RestartResult']
export type LoopResult = components['schemas']['LoopResult']
export type RemoveResult = components['schemas']['RemoveResult']
export type MoveResult = components['schemas']['MoveResult']
export type Job = components['schemas']['Job']
export type Fading = components['schemas']['Fading']
export type AudioFilters = components['schemas']['AudioFilters']
export type MixLayer = components['schemas']['MixLayer']
export type Meaning = components['schemas']['Meaning']
export type Lyrics = components['schemas']['Lyrics']
