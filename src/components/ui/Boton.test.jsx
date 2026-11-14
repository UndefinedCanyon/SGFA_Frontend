import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Boton from './Boton'

describe('Boton', () => {
  it('muestra su texto', () => {
    render(<Boton>Guardar</Boton>)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('es de tipo "button" por defecto, para no enviar formularios sin querer', () => {
    render(<Boton>Guardar</Boton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('permite el tipo "submit"', () => {
    render(<Boton type="submit">Enviar</Boton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('ejecuta onClick al hacer clic', async () => {
    const alHacerClic = vi.fn()
    render(<Boton onClick={alHacerClic}>Guardar</Boton>)
    await userEvent.click(screen.getByRole('button'))
    expect(alHacerClic).toHaveBeenCalledTimes(1)
  })

  it('no ejecuta onClick si está deshabilitado', async () => {
    const alHacerClic = vi.fn()
    render(
      <Boton disabled onClick={alHacerClic}>
        Guardar
      </Boton>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toBeDisabled()
    expect(alHacerClic).not.toHaveBeenCalled()
  })

  it('se deshabilita mientras está cargando', async () => {
    const alHacerClic = vi.fn()
    render(
      <Boton cargando onClick={alHacerClic}>
        Guardar
      </Boton>,
    )
    const boton = screen.getByRole('button')
    await userEvent.click(boton)
    expect(boton).toBeDisabled()
    expect(alHacerClic).not.toHaveBeenCalled()
  })

  it('aplica el color de cada variante', () => {
    const { rerender } = render(<Boton>Ok</Boton>)
    expect(screen.getByRole('button').className).toContain('bg-brand-600')

    rerender(<Boton variante="peligro">Ok</Boton>)
    expect(screen.getByRole('button').className).toContain('bg-red-600')

    rerender(<Boton variante="secundario">Ok</Boton>)
    expect(screen.getByRole('button').className).toContain('border-gray-300')
  })

  it('aplica el tamaño pequeño y las clases extra', () => {
    render(
      <Boton tamano="sm" className="mt-4">
        Ok
      </Boton>,
    )
    const clases = screen.getByRole('button').className
    expect(clases).toContain('px-3')
    expect(clases).toContain('mt-4')
  })
})