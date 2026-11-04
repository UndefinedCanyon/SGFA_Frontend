import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { prepararImagen, urlImagen } from './imagenes'

const MB = 1024 * 1024

function archivo({ tipo = 'image/png', bytes = 100 * 1024, nombre = 'foto.png' } = {}) {
  return new File([new Uint8Array(bytes)], nombre, { type: tipo })
}

describe('urlImagen', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('arma la dirección con la URL del servidor', () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test')
    expect(urlImagen('logo.webp')).toBe('http://api.test/imagenes/logo.webp')
  })

  it('codifica caracteres especiales del nombre', () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test')
    expect(urlImagen('mi foto?.png')).toBe('http://api.test/imagenes/mi%20foto%3F.png')
  })
})

describe('prepararImagen', () => {
  let bitmap
  let ultimoCanvas

  // Simula el navegador: un lienzo que "codifica" y un bitmap de la imagen elegida.
  function simularCanvas(crearBlob) {
    HTMLCanvasElement.prototype.getContext = vi.fn(function () {
      ultimoCanvas = this
      return { fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '' }
    })
    HTMLCanvasElement.prototype.toBlob = vi.fn(function (callback, tipo) {
      callback(crearBlob(tipo))
    })
  }

  beforeEach(() => {
    bitmap = { width: 800, height: 600, close: vi.fn() }
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('rechaza un tipo de archivo no permitido', async () => {
    await expect(prepararImagen(archivo({ tipo: 'application/pdf', nombre: 'a.pdf' }))).rejects.toThrow(
      'Usa una imagen JPG, PNG o WebP.',
    )
    expect(createImageBitmap).not.toHaveBeenCalled()
  })

  it('rechaza una imagen de más de 25 MB', async () => {
    const enorme = archivo()
    Object.defineProperty(enorme, 'size', { value: 26 * MB })
    await expect(prepararImagen(enorme)).rejects.toThrow('menos de 25 MB')
  })

  it('avisa si el navegador no puede leer la imagen', async () => {
    createImageBitmap.mockRejectedValue(new Error('corrupta'))
    await expect(prepararImagen(archivo())).rejects.toThrow('No pudimos leer esa imagen')
  })

  it('devuelve el mismo archivo si ya cumple peso y tamaño', async () => {
    const original = archivo({ bytes: 500 * 1024 })
    const resultado = await prepararImagen(original)
    expect(resultado).toBe(original)
    expect(bitmap.close).toHaveBeenCalledTimes(1)
  })

  it('reduce una imagen pesada y la entrega como WebP', async () => {
    simularCanvas((tipo) => new Blob([new Uint8Array(100 * 1024)], { type: tipo }))
    const resultado = await prepararImagen(archivo({ bytes: 3 * MB }))
    expect(resultado.type).toBe('image/webp')
    expect(resultado.name).toBe('imagen.webp')
    expect(bitmap.close).toHaveBeenCalledTimes(1)
  })

  it('reduce el lado mayor a 1280 píxeles manteniendo la proporción', async () => {
    bitmap.width = 3000
    bitmap.height = 2000
    simularCanvas((tipo) => new Blob([new Uint8Array(100 * 1024)], { type: tipo }))
    await prepararImagen(archivo({ bytes: 500 * 1024 }))
    expect(ultimoCanvas.width).toBe(1280)
    expect(ultimoCanvas.height).toBe(853)
  })

  it('usa JPG con fondo blanco si el navegador no sabe crear WebP', async () => {
    // Un navegador sin WebP devuelve PNG cuando se le pide WebP.
    simularCanvas((tipo) =>
      new Blob([new Uint8Array(100 * 1024)], { type: tipo === 'image/webp' ? 'image/png' : tipo }),
    )
    const resultado = await prepararImagen(archivo({ bytes: 3 * MB }))
    expect(resultado.type).toBe('image/jpeg')
    expect(resultado.name).toBe('imagen.jpg')
  })

  it('falla con un mensaje claro si no consigue reducirla', async () => {
    simularCanvas((tipo) => new Blob([new Uint8Array(2 * MB + 1)], { type: tipo }))
    await expect(prepararImagen(archivo({ bytes: 3 * MB }))).rejects.toThrow('No pudimos reducir la imagen')
    expect(bitmap.close).toHaveBeenCalledTimes(1)
  })
})