import { Resource } from './base.js'

const USER = '/v1/roblox/user/{target}' as const
const GAME = '/v1/roblox/game/{target}' as const

export class RobloxResource extends Resource {
  user(target: string | number) {
    return this.call('get', USER, { params: { target: String(target) } })
  }

  game(target: string | number) {
    return this.call('get', GAME, { params: { target: String(target) } })
  }
}
