import { Resource } from './base.js'
import type { Operation, QueryOf } from '../types.js'

const TRANSLATE = '/v1/translation/translate' as const
const DETECT = '/v1/translation/detect' as const
const LANGUAGES = '/v1/translation/languages' as const

export type TranslateQuery = QueryOf<Operation<typeof TRANSLATE, 'get'>>

export type DetectQuery = QueryOf<Operation<typeof DETECT, 'get'>>

export class TranslationResource extends Resource {
  translate(query: TranslateQuery) {
    return this.call('get', TRANSLATE, { query })
  }

  detect(query: DetectQuery) {
    return this.call('get', DETECT, { query })
  }

  languages() {
    return this.call('get', LANGUAGES)
  }
}
