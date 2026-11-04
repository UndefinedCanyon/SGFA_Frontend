import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Alerta from './Alerta'
import { useAvisos } from '../../context/AvisosContext'

vi.mock('../../context/AvisosContext', () => ({ useAvisos: vi.fn() }))

describe('Alerta', () => {
  beforeEach(() => {
    useAvisos.mockReset()
    useAvisos.mockReturnValue(undefined) // sin proveedor de avisos flotantes
  })

  it('no pinta nada si no hay mensaje', () => {
    const { container } = render(<Alerta tipo="error" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('los errores se anuncian con role="alert"', () => {
    render(<Alerta tipo="error">Algo falló</Alerta>)
    expect(screen.getByRole('alert')).toHaveTextContent('Algo falló')
  })

  it('los demás tipos usan role="status"', () => {
    render(<Alerta tipo="info">Información</Alerta>)
    expect(screen.getByRole('status')).toHaveTextContent('Información')
  })

  it('usa el tipo "info" por defecto y aplica clases extra', () => {
    render(<Alerta className="mb-4">Hola</Alerta>)
    const alerta = screen.getByRole('status')
    expect(alerta.className).toContain('bg-blue-50')
    expect(alerta.className).toContain('mb-4')
  })

  it('un éxito sin avisos flotantes se muestra en la página', () => {
    render(<Alerta tipo="exito">Guardado</Alerta>)
    expect(screen.getByRole('status')).toHaveTextContent('Guardado')
  })

  it('un éxito con avisos flotantes se envía como aviso y no se pinta en la página', () => {
    const mostrar = vi.fn()
    useAvisos.mockReturnValue({ mostrar })
    const { container } = render(<Alerta tipo="exito">Guardado</Alerta>)
    expect(container).toBeEmptyDOMElement()
    expect(mostrar).toHaveBeenCalledWith('exito', 'Guardado')
  })

  it('un error se queda en la página aunque existan avisos flotantes', () => {
    const mostrar = vi.fn()
    useAvisos.mockReturnValue({ mostrar })
    render(<Alerta tipo="error">Falló</Alerta>)
    expect(screen.getByRole('alert')).toHaveTextContent('Falló')
    expect(mostrar).not.toHaveBeenCalled()
  })
})