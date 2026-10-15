import { describe, expect, it } from 'bun:test'
import { Aegis } from '../src/client.js'
import { lastCall, stubFetch, type Responder } from './helpers.js'

const make = (responder?: Responder) => {
  const stub = stubFetch(responder)
  const aegis = new Aegis({
    apiKey: 'aegis.key',
    baseUrl: 'http://api.test',
    fetch: stub.fetch,
  })
  return { aegis, ...stub }
}

/** Asserts the verb and the path a resource method produced. */
function expectCall(
  calls: { url: string; init: RequestInit }[],
  method: string,
  path: string,
) {
  const call = lastCall(calls)
  expect(call.init.method).toBe(method)
  expect(call.url).toBe(`http://api.test${path}`)
}

describe('music', () => {
  it('play', async () => {
    const { aegis, calls } = make()
    await aegis.music.play('123', { query: 'lofi', channelId: '456' })

    expectCall(calls, 'POST', '/v1/music/guilds/123/play')
    expect(lastCall(calls).init.body).toBe('{"query":"lofi","channelId":"456"}')
  })

  it('pause, resume and skip', async () => {
    const { aegis, calls } = make()

    await aegis.music.pause('1')
    expectCall(calls, 'POST', '/v1/music/guilds/1/pause')

    await aegis.music.resume('1')
    expectCall(calls, 'POST', '/v1/music/guilds/1/resume')

    await aegis.music.skip('1')
    expectCall(calls, 'POST', '/v1/music/guilds/1/skip')
  })

  it('stop', async () => {
    const { aegis, calls } = make()
    await aegis.music.stop('1')

    expectCall(calls, 'DELETE', '/v1/music/guilds/1')
  })

  it('queue reads on GET and clears on DELETE', async () => {
    const { aegis, calls } = make()

    await aegis.music.queue('1')
    expectCall(calls, 'GET', '/v1/music/guilds/1/queue')

    await aegis.music.clearQueue('1')
    expectCall(calls, 'DELETE', '/v1/music/guilds/1/queue')
  })

  it('volume reads on GET and sets on PATCH', async () => {
    const { aegis, calls } = make()

    await aegis.music.volume('1')
    expectCall(calls, 'GET', '/v1/music/guilds/1/volume')

    await aegis.music.setVolume('1', { volume: 40, muted: true })
    expectCall(calls, 'PATCH', '/v1/music/guilds/1/volume')
    expect(lastCall(calls).init.body).toBe('{"volume":40,"muted":true}')
  })

  it('mute and unmute', async () => {
    const { aegis, calls } = make()

    await aegis.music.mute('1')
    expectCall(calls, 'POST', '/v1/music/guilds/1/mute')

    await aegis.music.unmute('1')
    expectCall(calls, 'DELETE', '/v1/music/guilds/1/mute')
  })

  it('seek and shuffle', async () => {
    const { aegis, calls } = make()

    await aegis.music.seek('1', { position: 30_000 })
    expectCall(calls, 'POST', '/v1/music/guilds/1/seek')

    await aegis.music.shuffle('1')
    expectCall(calls, 'POST', '/v1/music/guilds/1/shuffle')
  })

  it('restart', async () => {
    const { aegis, calls } = make()
    await aegis.music.restart('1')

    expectCall(calls, 'POST', '/v1/music/guilds/1/restart')
  })

  it('loop reads on GET and sets on PUT', async () => {
    const { aegis, calls } = make()

    await aegis.music.loop('1')
    expectCall(calls, 'GET', '/v1/music/guilds/1/loop')

    await aegis.music.setLoop('1', { mode: 'queue' })
    expectCall(calls, 'PUT', '/v1/music/guilds/1/loop')
    expect(lastCall(calls).init.body).toBe('{"mode":"queue"}')
  })

  it('removes and moves a queued track by index', async () => {
    const { aegis, calls } = make()

    await aegis.music.removeFromQueue('1', 3)
    expectCall(calls, 'DELETE', '/v1/music/guilds/1/queue/3')

    await aegis.music.moveInQueue('1', 3, { to: 0 })
    expectCall(calls, 'PATCH', '/v1/music/guilds/1/queue/3')
    expect(lastCall(calls).init.body).toBe('{"to":0}')
  })
})

describe('minecraft', () => {
  it('info and textures', async () => {
    const { aegis, calls } = make()

    await aegis.minecraft.info('Notch')
    expectCall(calls, 'GET', '/v1/minecraft/info/Notch')

    await aegis.minecraft.textures('Notch')
    expectCall(calls, 'GET', '/v1/minecraft/textures/Notch')
  })

  it('render passes its query through', async () => {
    const { aegis, calls } = make()
    await aegis.minecraft.render('Notch', { render: 'wave', scale: 2 })

    expectCall(calls, 'GET', '/v1/minecraft/render/Notch?render=wave&scale=2')
  })

  it('render sends no query when given none', async () => {
    const { aegis, calls } = make()
    await aegis.minecraft.render('Notch')

    expect(lastCall(calls).url).toBe(
      'http://api.test/v1/minecraft/render/Notch',
    )
  })
})

describe('jobs', () => {
  it('get and wait', async () => {
    const { aegis, calls } = make()

    await aegis.jobs.get('abc')
    expectCall(calls, 'GET', '/v1/jobs/abc')

    await aegis.jobs.wait('abc', { timeout: 60 })
    expectCall(calls, 'GET', '/v1/jobs/abc/wait?timeout=60')
  })
})

describe('fun', () => {
  it('roleplay', async () => {
    const { aegis, calls } = make()
    await aegis.fun.roleplay({ type: 'hug' })

    expectCall(calls, 'GET', '/v1/fun/roleplay?type=hug')
  })
})

describe('binary', () => {
  it('encode and decode', async () => {
    const { aegis, calls } = make()

    await aegis.binary.encode({ text: 'hello' })
    expectCall(calls, 'GET', '/v1/binary/encode?text=hello')

    await aegis.binary.decode({ text: '1010' })
    expectCall(calls, 'GET', '/v1/binary/decode?text=1010')
  })
})

describe('translation', () => {
  it('translate', async () => {
    const { aegis, calls } = make()
    await aegis.translation.translate({ text: 'hello', to: 'pt', from: 'en' })

    expectCall(
      calls,
      'GET',
      '/v1/translation/translate?text=hello&to=pt&from=en',
    )
  })

  it('detect and languages', async () => {
    const { aegis, calls } = make()

    await aegis.translation.detect({ text: 'ola' })
    expectCall(calls, 'GET', '/v1/translation/detect?text=ola')

    await aegis.translation.languages()
    expectCall(calls, 'GET', '/v1/translation/languages')
  })
})

describe('roblox', () => {
  it('user and game', async () => {
    const { aegis, calls } = make()

    await aegis.roblox.user('Mubi')
    expectCall(calls, 'GET', '/v1/roblox/user/Mubi')

    await aegis.roblox.game(107778070777162)
    expectCall(calls, 'GET', '/v1/roblox/game/107778070777162')
  })
})

describe('holidays', () => {
  it('next and year', async () => {
    const { aegis, calls } = make()

    await aegis.holidays.next('BR')
    expectCall(calls, 'GET', '/v1/holidays/BR/next')

    await aegis.holidays.year('BR', 2026)
    expectCall(calls, 'GET', '/v1/holidays/BR/2026')
  })
})

describe('bible', () => {
  it('languages, types and translations', async () => {
    const { aegis, calls } = make()

    await aegis.bible.languages()
    expectCall(calls, 'GET', '/v1/bible/languages')

    await aegis.bible.types('en')
    expectCall(calls, 'GET', '/v1/bible/languages/en/types')

    await aegis.bible.translations()
    expectCall(calls, 'GET', '/v1/bible/translations')
  })

  it('books and chapter', async () => {
    const { aegis, calls } = make()

    await aegis.bible.books('bbe')
    expectCall(calls, 'GET', '/v1/bible/bbe/books')

    await aegis.bible.chapter('bbe', 'John', 3)
    expectCall(calls, 'GET', '/v1/bible/bbe/books/John/chapters/3')
  })

  it('search uses q and verses uses refs', async () => {
    const { aegis, calls } = make()

    await aegis.bible.search('bbe', { q: 'love' })
    expectCall(calls, 'GET', '/v1/bible/bbe/search?q=love')

    await aegis.bible.verses('bbe', { refs: 'John 3:16' })
    expectCall(calls, 'GET', '/v1/bible/bbe/verses?refs=John+3%3A16')
  })

  it('data', async () => {
    const { aegis, calls } = make()
    await aegis.bible.data('en', 'books')

    expectCall(calls, 'GET', '/v1/bible/data/en/books')
  })
})

describe('general', () => {
  it('status', async () => {
    const { aegis, calls } = make()
    await aegis.general.status()

    expectCall(calls, 'GET', '/v1/status')
  })
})
