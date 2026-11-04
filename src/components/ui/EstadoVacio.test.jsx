import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import EstadoVacio from './EstadoVacio'

describe('EstadoVacio', () => {
  it('muestra solo el título cuando no hay más datos', () => {
    render(<EstadoVacio titulo="Aún no hay productos" />)
    expect(screen.getByText('Aún no hay productos')).toBeInTheDocument()
  })

  it('muestra la descripción si se entrega', () => {
    render(<EstadoVacio titulo="Sin datos" descripcion="Agrega tu primer producto." />)
    expect(screen.getByText('Agrega tu primer producto.')).toBeInTheDocument()
  })

  it('no dibuja descripción si no se entrega', () => {
    const { container } = render(<EstadoVacio titulo="Sin datos" />)
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  it('muestra la acción si se entrega', () => {
    render(<EstadoVacio titulo="Sin datos" accion={<button>Crear producto</button>} />)
    expect(screen.getByRole('button', { name: 'Crear producto' })).toBeInTheDocument()
  })
})