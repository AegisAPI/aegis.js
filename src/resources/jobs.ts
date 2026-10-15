import { Resource } from './base.js'
import type { Operation, QueryOf } from '../types.js'

const JOB = '/v1/jobs/{id}' as const
const JOB_WAIT = '/v1/jobs/{id}/wait' as const

export type WaitQuery = QueryOf<Operation<typeof JOB_WAIT, 'get'>>

export class JobsResource extends Resource {
  get(id: string) {
    return this.call('get', JOB, { params: { id } })
  }

  wait(id: string, query?: WaitQuery) {
    return this.call('get', JOB_WAIT, { params: { id }, query })
  }
}
