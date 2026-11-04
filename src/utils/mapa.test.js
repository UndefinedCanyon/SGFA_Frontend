import { describe, expect, it } from 'vitest'
import {
  ATRIBUCION,
  CENTRO_FUSAGASUGA,
  URL_TESELAS,
  enlaceComoLlegar,
  redondearCoordenada,
  tieneUbicacion,
} from './mapa'

describe('constantes del mapa', () => {
  it('el centro es una pareja [latitud, longitud] cerca de Fusagasugá', () => {
    expect(CENTRO_FUSAGASUGA).toHaveLength(2)
    expect(CENTRO_FUSAGASUGA[0]).toBeCloseTo(4.34, 1)
    expect(CENTRO_FUSAGASUGA[1]).toBeCloseTo(-74.36, 1)
  })

  it('las teselas usan la plantilla de OpenStreetMap', () => {
    expect(URL_TESELAS).toContain('{z}/{x}/{y}')
    expect(URL_TESELAS).toContain('openstreetmap.org')
  })

  it('mantiene la atribución obligatoria a OpenStreetMap', () => {
    expect(ATRIBUCION).toContain('OpenStreetMap')
    expect(ATRIBUCION).toContain('openstreetmap.org/copyright')
  })
})

describe('tieneUbicacion', () => {
  it('es verdadero con latitud y longitud', () => {
    expect(tieneUbicacion({ latitud: 4.3, longitud: -74.3 })).toBe(true)
  })

  it('es verdadero con coordenadas en cero', () => {
    expect(tieneUbicacion({ latitud: 0, longitud: 0 })).toBe(true)
  })

  it('es falso si falta alguna coordenada', () => {
    expect(tieneUbicacion({ latitud: null, longitud: -74.3 })).toBe(false)
    expect(tieneUbicacion({ latitud: 4.3, longitud: undefined })).toBe(false)
  })

  it('es falso si no hay lugar', () => {
    expect(tieneUbicacion(null)).toBe(false)
    expect(tieneUbicacion(undefined)).toBe(false)
  })
})

describe('enlaceComoLlegar', () => {
  it('apunta a las indicaciones de Google Maps con el destino', () => {
    expect(enlaceComoLlegar({ latitud: 4.3369, longitud: -74.3639 })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=4.3369,-74.3639',
    )
  })
})

describe('redondearCoordenada', () => {
  it('conserva seis decimales', () => {
    expect(redondearCoordenada(4.33691234567)).toBe(4.336912)
    expect(redondearCoordenada(-74.363949999)).toBe(-74.36395)
  })

  it('no altera un valor que ya es corto', () => {
    expect(redondearCoordenada(4.5)).toBe(4.5)
  })
})