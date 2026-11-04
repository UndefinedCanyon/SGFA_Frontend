import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  describirEdicion,
  destinoPorRol,
  estadoEdicion,
  formatearFecha,
  formatearFechaCorta,
  formatearPrecio,
  hoyISO,
  normalizarTexto,
} from './helpers'

describe('formatearFecha', () => {
  it('convierte AAAA-MM-DD en DD/MM/AAAA', () => {
    expect(formatearFecha('2026-11-04')).toBe('04/11/2026')
  })
})

describe('formatearFechaCorta', () => {
  it('muestra día, mes abreviado y año', () => {
    const texto = formatearFechaCorta('2026-11-04')
    expect(texto).toMatch(/4/)
    expect(texto).toMatch(/nov/i)
    expect(texto).toMatch(/2026/)
  })

  it('no se desfasa un día por la zona horaria', () => {
    expect(formatearFechaCorta('2026-01-01')).toMatch(/1/)
    expect(formatearFechaCorta('2026-01-01')).toMatch(/ene/i)
  })
})

describe('formatearPrecio', () => {
  it('usa punto como separador de miles', () => {
    expect(formatearPrecio(15000)).toBe('15.000')
    expect(formatearPrecio(1500000)).toBe('1.500.000')
  })

  it('acepta el valor como texto', () => {
    expect(formatearPrecio('2500')).toBe('2.500')
  })

  it('deja un precio pequeño sin separador', () => {
    expect(formatearPrecio(950)).toBe('950')
  })
})

describe('destinoPorRol', () => {
  it('lleva al administrador a /admin', () => {
    expect(destinoPorRol('ADMINISTRADOR')).toBe('/admin')
  })

  it('lleva a cualquier otro rol a /mi-panel', () => {
    expect(destinoPorRol('ARTESANO')).toBe('/mi-panel')
    expect(destinoPorRol(undefined)).toBe('/mi-panel')
  })
})

describe('normalizarTexto', () => {
  it('quita tildes y pasa a minúsculas', () => {
    expect(normalizarTexto('Fusagasugá')).toBe('fusagasuga')
    expect(normalizarTexto('ÁRBOL Ñandú')).toBe('arbol nandu')
  })

  it('devuelve texto vacío si no hay valor', () => {
    expect(normalizarTexto(null)).toBe('')
    expect(normalizarTexto(undefined)).toBe('')
  })
})

describe('con fecha fija', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 4, 10, 0, 0)) // 4 de noviembre de 2026
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('hoyISO', () => {
    it('devuelve la fecha de hoy como AAAA-MM-DD', () => {
      expect(hoyISO()).toBe('2026-11-04')
    })

    it('completa con cero el mes y el día', () => {
      vi.setSystemTime(new Date(2026, 0, 5, 10, 0, 0))
      expect(hoyISO()).toBe('2026-01-05')
    })
  })

  describe('estadoEdicion', () => {
    it('es FINALIZADA si ya terminó', () => {
      expect(estadoEdicion({ fechaInicio: '2026-10-01', fechaFin: '2026-10-03' })).toBe('FINALIZADA')
    })

    it('es PROXIMA si aún no empieza', () => {
      expect(estadoEdicion({ fechaInicio: '2026-12-01', fechaFin: '2026-12-03' })).toBe('PROXIMA')
    })

    it('es EN_CURSO si hoy está entre el inicio y el fin', () => {
      expect(estadoEdicion({ fechaInicio: '2026-11-01', fechaFin: '2026-11-10' })).toBe('EN_CURSO')
    })

    it('es EN_CURSO el mismo día en que termina', () => {
      expect(estadoEdicion({ fechaInicio: '2026-11-01', fechaFin: '2026-11-04' })).toBe('EN_CURSO')
    })

    it('es EN_CURSO el mismo día en que empieza', () => {
      expect(estadoEdicion({ fechaInicio: '2026-11-04', fechaFin: '2026-11-08' })).toBe('EN_CURSO')
    })
  })
})

describe('describirEdicion', () => {
  const ediciones = [{ id: 1, idFeria: 10, idLugar: 20, fechaInicio: '2026-12-01', fechaFin: '2026-12-03' }]
  const ferias = [{ id: 10, nombreFeria: 'Feria Artesanal' }]
  const lugares = [{ id: 20, nombre: 'Parque Principal' }]

  it('arma la descripción con feria, fechas y lugar', () => {
    const texto = describirEdicion(1, ediciones, ferias, lugares)
    expect(texto).toContain('Feria Artesanal')
    expect(texto).toContain('01/12/2026')
    expect(texto).toContain('03/12/2026')
    expect(texto).toContain('Parque Principal')
  })

  it('usa el número de edición si no la encuentra', () => {
    expect(describirEdicion(99, ediciones, ferias, lugares)).toMatch(/#99/)
  })

  it('usa el número de feria si la feria no está en la lista', () => {
    expect(describirEdicion(1, ediciones, [], lugares)).toContain('Feria #10')
  })

  it('usa el número de lugar si el lugar no está en la lista', () => {
    expect(describirEdicion(1, ediciones, ferias, [])).toContain('Lugar #20')
  })
})