import type { Http, SendOptions } from '../http.js'
import type {
  HttpMethod,
  MethodOf,
  PathKey,
  RequestOptions,
  Result,
} from '../types.js'

export class Resource {
  protected readonly http: Http

  constructor(http: Http) {
    this.http = http
  }

  /** `M & MethodOf<P>` infers `M`, and rejects a method the path lacks. */
  protected call<P extends PathKey, M extends HttpMethod>(
    method: M & MethodOf<NoInfer<P>>,
    path: P,
    options?: RequestOptions<P, M>,
  ): Promise<Result<P, M>> {
    return this.http.send(method, path, options as SendOptions) as Promise<
      Result<P, M>
    >
  }
}
