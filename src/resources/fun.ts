import { Resource } from './base.js'
import type { Operation, QueryOf } from '../types.js'

const ROLEPLAY = '/v1/fun/roleplay' as const

export type RoleplayQuery = QueryOf<Operation<typeof ROLEPLAY, 'get'>>

export class FunResource extends Resource {
  roleplay(query: RoleplayQuery) {
    return this.call('get', ROLEPLAY, { query })
  }
}
