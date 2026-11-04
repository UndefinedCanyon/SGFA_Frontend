import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RutaProtegida from './RutaProtegida'
import { useAuth } from '../context/AuthContext'

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))

function pintar(rolPermitido) {
  return render(
    <MemoryRouter initialEntries={['/privada']}>
      <Routes>
        <Route
          path="/privada"
          element={
            <RutaProtegida rolPermitido={rolPermitido}>
              <p>Contenido privado</p>
            </RutaProtegida>
          }
        />
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route path="/" element={<p>Pantalla de inicio</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RutaProtegida', () => {
  beforeEach(() => {
    useAuth.mockReset()
  })

  it('envía al login a quien no ha iniciado sesión', () => {
    useAuth.mockReturnValue({ usuario: null })
    pintar('ADMINISTRADOR')
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument()
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('envía al inicio a quien tiene otro rol', () => {
    useAuth.mockReturnValue({ usuario: { rol: 'ARTESANO' } })
    pintar('ADMINISTRADOR')
    expect(screen.getByText('Pantalla de inicio')).toBeInTheDocument()
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('muestra el contenido a quien tiene el rol permitido', () => {
    useAuth.mockReturnValue({ usuario: { rol: 'ADMINISTRADOR' } })
    pintar('ADMINISTRADOR')
    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })

  it('si no se exige rol, basta con haber iniciado sesión', () => {
    useAuth.mockReturnValue({ usuario: { rol: 'ARTESANO' } })
    pintar(undefined)
    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })
})