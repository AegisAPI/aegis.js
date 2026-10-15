import type { components } from './generated/schema.js'

export type ApiErrorCode =
  components['schemas']['ErrorResponse']['error']['code']

export type ErrorResponse = components['schemas']['ErrorResponse']

export interface AegisErrorOptions {
  status: number
  code: ApiErrorCode | string
  requestId?: string
  body?: unknown
}

/** Thrown for any non-2xx answer, and for a request that never left the box. */
export class AegisError extends Error {
  readonly status: number
  readonly code: ApiErrorCode | string
  readonly requestId: string | undefined
  readonly body: unknown

  constructor(message: string, options: AegisErrorOptions) {
    super(message)
    this.name = 'AegisError'
    this.status = options.status
    this.code = options.code
    this.requestId = options.requestId
    this.body = options.body
  }
}
