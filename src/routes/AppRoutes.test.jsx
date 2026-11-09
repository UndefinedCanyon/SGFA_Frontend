import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../layout/Layout", async () => {
    const { Outlet } = await import("react-router-dom");
    return { default: () => (<div><p>layout</p><Outlet /></div>) };
});
vi.mock("../pages/Inicio", () => ({ default: () => <p>pagina-inicio</p> }));
vi.mock("../pages/RegistroArtesano", () => ({ default: () => <p>pagina-registro</p> }));
vi.mock("../pages/Login", () => ({ default: () => <p>pagina-login</p> }));
vi.mock("../pages/VerificarCorreo", () => ({ default: () => <p>pagina-verificar</p> }));
vi.mock("../pages/OlvideContrasena", () => ({ default: () => <p>pagina-olvide</p> }));
vi.mock("../pages/RestablecerContrasena", () => ({ default: () => <p>pagina-restablecer</p> }));
vi.mock("../pages/Ferias", () => ({ default: () => <p>pagina-ferias</p> }));
vi.mock("../pages/PanelAdministrador", () => ({ default: () => <p>panel-admin</p> }));
vi.mock("../pages/PanelArtesano", () => ({ default: () => <p>panel-artesano</p> }));
vi.mock("../pages/NoEncontrado", () => ({ default: () => <p>pagina-404</p> }));
vi.mock("./RutaProtegida", () => ({ default: ({ rolPermitido, children }) => (
    <div data-testid="protegida" data-rol={rolPermitido}>{children}</div>
) }));
vi.mock("../context/AvisosContext", () => ({ ProveedorAvisos: ({ children }) => <div>{children}</div> }));

import AppRoutes from "./AppRoutes";

function irA(ruta) {
    window.history.pushState({}, "", ruta);
    return render(<AppRoutes />);
}

beforeEach(() => window.history.pushState({}, "", "/"));
afterEach(() => window.history.pushState({}, "", "/"));

describe("AppRoutes", () => {
    it.each([
        ["/", "pagina-inicio"],
        ["/registro", "pagina-registro"],
        ["/login", "pagina-login"],
        ["/verificar-correo", "pagina-verificar"],
        ["/olvide-contrasena", "pagina-olvide"],
        ["/restablecer-contrasena", "pagina-restablecer"],
        ["/ferias", "pagina-ferias"],
        ["/ruta-que-no-existe", "pagina-404"],
    ])("la ruta %s muestra %s dentro del layout", (ruta, texto) => {
        irA(ruta);

        expect(screen.getByText("layout")).toBeInTheDocument();
        expect(screen.getByText(texto)).toBeInTheDocument();
    });

    it("/admin está protegida y exige el rol ADMINISTRADOR", () => {
        irA("/admin");

        expect(screen.getByTestId("protegida")).toHaveAttribute("data-rol", "ADMINISTRADOR");
        expect(screen.getByText("panel-admin")).toBeInTheDocument();
    });

    it("/mi-panel está protegida y exige el rol ARTESANO", () => {
        irA("/mi-panel");

        expect(screen.getByTestId("protegida")).toHaveAttribute("data-rol", "ARTESANO");
        expect(screen.getByText("panel-artesano")).toBeInTheDocument();
    });
});
