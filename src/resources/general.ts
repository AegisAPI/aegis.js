import { Resource } from './base.js'

const STATUS = '/v1/status' as const

export class GeneralResource extends Resource {
  status() {
    return this.call('get', STATUS)
  }
}
