import { Resource } from './base.js'
import type { Operation, PathParamsOf, QueryOf } from '../types.js'

const FILTER = '/v1/image/filter/{type}' as const
const OVERLAY = '/v1/image/overlay/{type}' as const

export type ImageFilterType = PathParamsOf<
  Operation<typeof FILTER, 'get'>
>['type']
export type ImageOverlayType = PathParamsOf<
  Operation<typeof OVERLAY, 'get'>
>['type']

export type FilterQuery = QueryOf<Operation<typeof FILTER, 'get'>>
export type OverlayQuery = QueryOf<Operation<typeof OVERLAY, 'get'>>

export class ImageResource extends Resource {
  filter(type: ImageFilterType, query: FilterQuery) {
    return this.call('get', FILTER, { params: { type }, query })
  }

  overlay(type: ImageOverlayType, query: OverlayQuery) {
    return this.call('get', OVERLAY, { params: { type }, query })
  }
}
