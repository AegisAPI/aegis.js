import { Resource } from './base.js'
import type { Operation, QueryOf } from '../types.js'

const INFO = '/v1/minecraft/info/{player}' as const
const TEXTURES = '/v1/minecraft/textures/{player}' as const
const RENDER = '/v1/minecraft/render/{player}' as const

export type RenderQuery = QueryOf<Operation<typeof RENDER, 'get'>>

export class MinecraftResource extends Resource {
  info(player: string) {
    return this.call('get', INFO, { params: { player } })
  }

  textures(player: string) {
    return this.call('get', TEXTURES, { params: { player } })
  }

  render(player: string, query?: RenderQuery) {
    return this.call('get', RENDER, { params: { player }, query })
  }
}
