import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Insignia from './Insignia'

describe('Insignia', () => {
  it('muestra su texto', () => {
    render(<Insignia>Activo</Insignia>)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('usa el tono gris por defecto', () => {
    render(<Insignia>Pendiente</Insignia>)
    expect(screen.getByText('Pendiente').className).toContain('bg-gray-100')
  })

  it('cambia de color según el tono', () => {
    const { rerender } = render(<Insignia tono="verde">Estado</Insignia>)
    expect(screen.getByText('Estado').className).toContain('bg-green-100')

    rerender(<Insignia tono="rojo">Estado</Insignia>)
    expect(screen.getByText('Estado').className).toContain('bg-red-100')

    rerender(<Insignia tono="ambar">Estado</Insignia>)
    expect(screen.getByText('Estado').className).toContain('bg-amber-100')

    rerender(<Insignia tono="azul">Estado</Insignia>)
    expect(screen.getByText('Estado').className).toContain('bg-blue-100')
  })
})