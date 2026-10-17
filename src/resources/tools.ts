import { Resource } from './base.js'
import type { Operation, QueryOf } from '../types.js'

const SCREENSHOT = '/v1/tools/screenshot' as const
const ENCODE = '/v1/tools/binary/encode' as const
const DECODE = '/v1/tools/binary/decode' as const

export type ScreenshotQuery = QueryOf<Operation<typeof SCREENSHOT, 'get'>>
export type EncodeQuery = QueryOf<Operation<typeof ENCODE, 'get'>>
export type DecodeQuery = QueryOf<Operation<typeof DECODE, 'get'>>

export class ToolsResource extends Resource {
  /** Queues a render, so poll the returned `jobId` through `aegis.jobs`. */
  screenshot(query: ScreenshotQuery) {
    return this.call('get', SCREENSHOT, { query })
  }

  encode(query: EncodeQuery) {
    return this.call('get', ENCODE, { query })
  }

  decode(query: DecodeQuery) {
    return this.call('get', DECODE, { query })
  }
}
