import { Resource } from './base.js'

const NEXT = '/v1/holidays/{countryCode}/next' as const
const YEAR = '/v1/holidays/{countryCode}/{year}' as const

export class HolidaysResource extends Resource {
  next(countryCode: string) {
    return this.call('get', NEXT, { params: { countryCode } })
  }

  year(countryCode: string, year: number) {
    return this.call('get', YEAR, { params: { countryCode, year } })
  }
}
