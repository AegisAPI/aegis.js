import { Resource } from './base.js'
import type { Operation, QueryOf } from '../types.js'

const LANGUAGES = '/v1/bible/languages' as const
const TYPES = '/v1/bible/languages/{language}/types' as const
const TRANSLATIONS = '/v1/bible/translations' as const
const BOOKS = '/v1/bible/{translation}/books' as const
const CHAPTER =
  '/v1/bible/{translation}/books/{book}/chapters/{chapter}' as const
const SEARCH = '/v1/bible/{translation}/search' as const
const VERSES = '/v1/bible/{translation}/verses' as const
const DATA = '/v1/bible/data/{language}/{type}' as const

export type BibleSearchQuery = QueryOf<Operation<typeof SEARCH, 'get'>>

export type BibleVersesQuery = QueryOf<Operation<typeof VERSES, 'get'>>

export class BibleResource extends Resource {
  languages() {
    return this.call('get', LANGUAGES)
  }

  types(language: string) {
    return this.call('get', TYPES, { params: { language } })
  }

  translations() {
    return this.call('get', TRANSLATIONS)
  }

  books(translation: string) {
    return this.call('get', BOOKS, { params: { translation } })
  }

  chapter(translation: string, book: string, chapter: number) {
    return this.call('get', CHAPTER, { params: { translation, book, chapter } })
  }

  search(translation: string, query: BibleSearchQuery) {
    return this.call('get', SEARCH, { params: { translation }, query })
  }

  verses(translation: string, query: BibleVersesQuery) {
    return this.call('get', VERSES, { params: { translation }, query })
  }

  data(language: string, type: string) {
    return this.call('get', DATA, { params: { language, type } })
  }
}
