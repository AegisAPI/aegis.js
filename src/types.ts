import type { paths } from './generated/schema.js'

export type Paths = paths

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export type PathKey = keyof Paths

/** Missing methods are emitted as `?: never`, which indexes as `undefined`. */
export type MethodOf<P extends PathKey> = {
  [M in keyof Paths[P] & HttpMethod]: [NonNullable<Paths[P][M]>] extends [never]
    ? never
    : M
}[keyof Paths[P] & HttpMethod]

/** Looser than `MethodOf<P>` on purpose, so the pair can be forwarded. */
export type Operation<P extends PathKey, M extends HttpMethod> = [M] extends [
  MethodOf<P>,
]
  ? Paths[P][M]
  : never

declare const nothingBrand: unique symbol

/** Branded, because a real parameter object is also assignable to `{}`. */
export type Nothing = { readonly [nothingBrand]: true }

/** `openapi-typescript` marks an absent parameter group as `?: never`. */
type Defined<T> = [NonNullable<T>] extends [never] ? Nothing : NonNullable<T>

type ResponsesOf<Op> = Op extends { responses: infer R } ? R : never

type SuccessCode<Op> = Extract<keyof ResponsesOf<Op>, 200 | 201 | 202 | 204>

export type PathParamsOf<Op> = Op extends { parameters: { path?: infer P } }
  ? Defined<P>
  : Nothing

export type QueryOf<Op> = Op extends { parameters: { query?: infer Q } }
  ? Defined<Q>
  : Nothing

export type JsonBodyOf<Op> = Op extends {
  requestBody: { content: { 'application/json': infer B } }
}
  ? B
  : never

/** The JSON body of the operation's success response. */
export type ResponseOf<Op> = {
  [S in SuccessCode<Op>]: ResponsesOf<Op>[S] extends {
    content: { 'application/json': infer J }
  }
    ? J
    : never
}[SuccessCode<Op>]

/** Every endpoint answers `{ data }` on success, so that is what comes out. */
type Unwrap<T> = T extends { data: infer D } ? D : T

/** What a successful call resolves to. */
export type Result<P extends PathKey, M extends HttpMethod> = Unwrap<
  ResponseOf<Operation<P, M>>
>

export type HasPath<Op> = [PathParamsOf<Op>] extends [Nothing] ? false : true

export type HasQuery<Op> = [QueryOf<Op>] extends [Nothing] ? false : true

export type HasBody<Op> = [JsonBodyOf<Op>] extends [never] ? false : true

/** Fields the route lacks are `Nothing`, so passing one is a type error. */
export type RequestOptions<P extends PathKey, M extends HttpMethod> = {
  params?: PathParamsOf<Operation<P, M>>
  query?: QueryOf<Operation<P, M>>
  body?: JsonBodyOf<Operation<P, M>>
}
