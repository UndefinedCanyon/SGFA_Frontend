import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BarraCupo from './BarraCupo'

describe('BarraCupo', () => {
  it('no pinta nada si no hay datos de ocupación', () => {
    const { container } = render(<BarraCupo ocupacion={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  describe('sin límite de cupo', () => {
    it('indica que no hay límite y cuántos hay aprobados', () => {
      render(<BarraCupo ocupacion={{ cupoMaximo: null, aprobados: 3, disponibles: null }} />)
      expect(screen.getByText(/Sin l.mite de cupo/)).toBeInTheDocument()
      expect(screen.getByText(/3 artesanos aprobados/)).toBeInTheDocument()
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    it('usa el singular con un solo aprobado', () => {
      render(<BarraCupo ocupacion={{ cupoMaximo: undefined, aprobados: 1, disponibles: null }} />)
      expect(screen.getByText(/1 artesano aprobado$/)).toBeInTheDocument()
    })
  })

  describe('con cupo máximo', () => {
    it('muestra el avance, el porcentaje y los cupos disponibles', () => {
      render(<BarraCupo ocupacion={{ cupoMaximo: 10, aprobados: 5, disponibles: 5 }} />)
      expect(screen.getByText('50%')).toBeInTheDocument()
      expect(screen.getByText('5 cupos disponibles')).toBeInTheDocument()

      const barra = screen.getByRole('progressbar', { name: 'Cupo ocupado' })
      expect(barra).toHaveAttribute('aria-valuenow', '5')
      expect(barra).toHaveAttribute('aria-valuemax', '10')
    })

    it('usa el singular con un solo cupo disponible', () => {
      render(<BarraCupo ocupacion={{ cupoMaximo: 10, aprobados: 9, disponibles: 1 }} />)
      expect(screen.getByText('1 cupo disponible')).toBeInTheDocument()
    })

    it('avisa cuando no quedan cupos', () => {
      render(<BarraCupo ocupacion={{ cupoMaximo: 4, aprobados: 4, disponibles: 0 }} />)
      expect(screen.getByText('Sin cupos disponibles')).toBeInTheDocument()
      expect(screen.getByText('100%').className).toContain('text-red-600')
    })

    it('nunca muestra más del 100 %', () => {
      render(<BarraCupo ocupacion={{ cupoMaximo: 4, aprobados: 6, disponibles: 0 }} />)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('anima la barra hasta su porcentaje', async () => {
      render(<BarraCupo ocupacion={{ cupoMaximo: 10, aprobados: 5, disponibles: 5 }} />)
      const relleno = screen.getByRole('progressbar').firstChild
      await waitFor(() => expect(relleno).toHaveStyle({ width: '50%' }))
    })
  })
})