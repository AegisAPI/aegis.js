import { AegisError } from './errors.js'
import { Http, type HttpOptions, type SendOptions } from './http.js'
import {
  BibleResource,
  BinaryResource,
  FunResource,
  GeneralResource,
  HolidaysResource,
  ImageResource,
  JobsResource,
  MinecraftResource,
  MusicResource,
  RobloxResource,
  ToolsResource,
  TranslationResource,
} from './resources/index.js'
import type {
  HttpMethod,
  MethodOf,
  PathKey,
  RequestOptions,
  Result,
} from './types.js'

export interface AegisOptions extends HttpOptions {}

export class Aegis {
  readonly http: Http
  readonly music: MusicResource
  readonly minecraft: MinecraftResource
  readonly jobs: JobsResource
  readonly bible: BibleResource
  readonly binary: BinaryResource
  readonly translation: TranslationResource
  readonly roblox: RobloxResource
  readonly holidays: HolidaysResource
  readonly fun: FunResource
  readonly image: ImageResource
  readonly tools: ToolsResource
  readonly general: GeneralResource

  constructor(options: AegisOptions = {}) {
    if (options.baseUrl === undefined && options.apiKey === undefined) {
      throw new AegisError(
        'Aegis needs an apiKey, or at least an explicit baseUrl.',
        { status: 0, code: 'bad_request' },
      )
    }

    this.http = new Http(options)
    this.music = new MusicResource(this.http, options)
    this.minecraft = new MinecraftResource(this.http)
    this.jobs = new JobsResource(this.http)
    this.bible = new BibleResource(this.http)
    this.binary = new BinaryResource(this.http)
    this.translation = new TranslationResource(this.http)
    this.roblox = new RobloxResource(this.http)
    this.holidays = new HolidaysResource(this.http)
    this.fun = new FunResource(this.http)
    this.image = new ImageResource(this.http)
    this.tools = new ToolsResource(this.http)
    this.general = new GeneralResource(this.http)
  }

  /** Escape hatch for the routes without a named method yet. */
  request<P extends PathKey, M extends HttpMethod>(
    method: M & MethodOf<NoInfer<P>>,
    path: P,
    options?: RequestOptions<P, M>,
  ): Promise<Result<P, M>> {
    return this.http.send(method, path, options as SendOptions) as Promise<
      Result<P, M>
    >
  }
}
