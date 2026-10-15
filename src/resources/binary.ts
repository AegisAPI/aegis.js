import { Resource } from './base.js'
import type { Operation, QueryOf } from '../types.js'

const ENCODE = '/v1/binary/encode' as const
const DECODE = '/v1/binary/decode' as const

export type EncodeQuery = QueryOf<Operation<typeof ENCODE, 'get'>>

export type DecodeQuery = QueryOf<Operation<typeof DECODE, 'get'>>

export class BinaryResource extends Resource {
  encode(query: EncodeQuery) {
    return this.call('get', ENCODE, { query })
  }

  decode(query: DecodeQuery) {
    return this.call('get', DECODE, { query })
  }
}
