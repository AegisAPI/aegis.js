import { Resource } from './base.js'
import type { DecodeQuery, EncodeQuery } from './tools.js'

export type { DecodeQuery, EncodeQuery }

/** @deprecated The API moved these under `/v1/tools`; use `aegis.tools`. */
export class BinaryResource extends Resource {
  encode(query: EncodeQuery) {
    return this.call('get', '/v1/tools/binary/encode', { query })
  }

  decode(query: DecodeQuery) {
    return this.call('get', '/v1/tools/binary/decode', { query })
  }
}
