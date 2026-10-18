import { Aegis } from '../src/index.js'
import type { FadingBody, FiltersBody, LyricsQuery } from '../src/index.js'

const aegis = new Aegis({ apiKey: 'k' })

// ---- fading ----
await aegis.music.fading('123')
await aegis.music.setFading('123', { enabled: false })
await aegis.music.setFading('123', {
  enabled: true,
  trackStart: { duration: 1500, curve: 's-curve' },
  trackEnd: { duration: 800, curve: 'linear' },
  trackStop: { duration: 300, curve: 'logarithmic' },
  seek: { duration: 500, curve: 'exponential' },
  ducking: { duration: 250, curve: 's-curve' },
})

// @ts-expect-error enabled e obrigatorio
await aegis.music.setFading('123', {})

const badCurve = { enabled: true, seek: { duration: 1, curve: 'wobble' } }
// @ts-expect-error curva fora da lista
await aegis.music.setFading('123', badCurve)

// @ts-expect-error duration e obrigaria na secao
await aegis.music.setFading('123', { enabled: true, seek: { curve: 'linear' } })

// ---- next-track ----
await aegis.music.nextTrack('123')
await aegis.music.setNextTrack('123', { gapless: true })
await aegis.music.setNextTrack('123', { gapless: false })

// @ts-expect-error gapless e booleano
await aegis.music.setNextTrack('123', { gapless: 'yes' })

// ---- filters ----
await aegis.music.filters('123')
await aegis.music.setFilters('123', {})
await aegis.music.setFilters('123', {
  equalizer: [{ band: 0, gain: 0.2 }],
  echo: { delay: 500, feedback: 0.3, mix: 0.5 },
  chorus: { rate: 1.5, depth: 0.5, delay: 25, mix: 0.6, feedback: 0.2 },
  compressor: { threshold: -20, ratio: 4, attack: 10, release: 100, gain: 5 },
  highpass: { smoothing: 20 },
  lowPass: { smoothing: 20 },
  phaser: {
    stages: 6,
    rate: 0.5,
    depth: 0.7,
    feedback: 0.5,
    mix: 0.5,
    minFrequency: 200,
    maxFrequency: 2000,
  },
  spatial: { depth: 0.8, rate: 0.3 },
  timescale: { speed: 1.5, pitch: 1, rate: 1 },
  tremolo: { frequency: 2, depth: 0.5 },
  vibrato: { frequency: 4, depth: 0.5 },
  rotation: { rotationHz: 0.2 },
})

// @ts-expect-error filtro desconhecido
await aegis.music.setFilters('123', { reverb: { room: 1 } })

// @ts-expect-error campo obrigatorio do filtro faltando
await aegis.music.setFilters('123', { echo: { delay: 500 } })

// ---- mix ----
// `volume` carries a server default of 0.8, but openapi-typescript treats a
// defaulted property as required, so the type asks for it explicitly.
await aegis.music.mix('123')
await aegis.music.addMix('123', { track: { encoded: 'QAAA' }, volume: 0.9 })
await aegis.music.addMix('123', {
  track: { encoded: 'QAAA', userData: { label: 'tts' } },
  volume: 0.8,
})
await aegis.music.setMixVolume('123', 'mix-1', { volume: 0.5 })
await aegis.music.removeMix('123', 'mix-1')

// @ts-expect-error encoded e obrigatorio
await aegis.music.addMix('123', { track: {} })

// @ts-expect-error volume e obrigatorio no tipo, mesmo com default no servidor
await aegis.music.addMix('123', { track: { encoded: 'QAAA' } })

// @ts-expect-error volume e obrigatorio no setMixVolume
await aegis.music.setMixVolume('123', 'mix-1', {})

// ---- meaning e lyrics ----
await aegis.music.meaning('123', { encoded: 'QAAA' })
await aegis.music.lyrics('123', { encoded: 'QAAA' })
await aegis.music.lyrics('123', { encoded: 'QAAA', lang: 'pt' })

const lyrics: LyricsQuery = { encoded: 'QAAA' }
await aegis.music.lyrics('123', lyrics)

// @ts-expect-error encoded e obrigatorio
await aegis.music.meaning('123', {})

// @ts-expect-error lang precisa ser string
await aegis.music.lyrics('123', { encoded: 'QAAA', lang: 1 })

const body: FadingBody = { enabled: true }
const filters: FiltersBody = { echo: { delay: 1, feedback: 0, mix: 1 } }
export { body, filters }
