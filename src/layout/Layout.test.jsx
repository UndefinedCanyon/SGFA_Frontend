import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Layout from "./Layout";
import { useAuth } from "../context/AuthContext";

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

let descartarAvisoSesion;

beforeEach(() => {
    vi.clearAllMocks();
    descartarAvisoSesion = vi.fn();
    window.scrollTo = vi.fn();
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true, writable: true });
    delete document.documentElement.dataset.desplazado;
    useAuth.mockReturnValue({
        usuario: null,
        cerrarSesion: vi.fn(),
        sesionExpirada: false,
        descartarAvisoSesion,
    });
});

afterEach(() => {
    vi.restoreAllMocks();
});

function montar(ruta = "/ferias") {
    return render(
        <MemoryRouter initialEntries={[ruta]}>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/ferias" element={<Link to="/login">ir al login</Link>} />
                    <Route path="/login" element={<p>pantalla de login</p>} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

function conSesionExpirada() {
    useAuth.mockReturnValue({
        usuario: null,
        cerrarSesion: vi.fn(),
        sesionExpirada: true,
        descartarAvisoSesion,
    });
}

describe("Layout", () => {
    it("muestra el encabezado, el contenido de la ruta y el pie de página", () => {
        montar();

        expect(screen.getByRole("banner")).toBeInTheDocument();
        expect(screen.getByRole("main")).toHaveTextContent("ir al login");
        expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    });

    it("incluye un enlace para saltar al contenido", () => {
        montar();

        expect(screen.getByRole("link", { name: "Saltar al contenido" })).toHaveAttribute("href", "#contenido");
        expect(screen.getByRole("main")).toHaveAttribute("id", "contenido");
    });

    it("lleva la página arriba al entrar y cada vez que cambia la ruta", () => {
        montar();
        expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
        const llamadasIniciales = window.scrollTo.mock.calls.length;

        fireEvent.click(screen.getByRole("link", { name: "ir al login" }));

        expect(screen.getByText("pantalla de login")).toBeInTheDocument();
        expect(window.scrollTo.mock.calls.length).toBe(llamadasIniciales + 1);
    });

    it("no muestra el aviso de sesión si no expiró", () => {
        montar();

        expect(screen.queryByText(/Tu sesión expiró/)).not.toBeInTheDocument();
    });
});

describe("Layout: sesión expirada", () => {
    it("muestra el aviso con un enlace al login", () => {
        conSesionExpirada();

        montar("/ferias");

        expect(screen.getByText(/Tu sesión expiró/)).toBeInTheDocument();
        const enlaces = screen.getAllByRole("link", { name: "Iniciar sesión" });
        expect(enlaces.some((e) => e.className.includes("bg-green-600") && e.closest("main") === null)).toBe(true);
    });

    it("en el propio login no repite el enlace al login dentro del aviso", () => {
        conSesionExpirada();

        montar("/login");

        const aviso = screen.getByText(/Tu sesión expiró/).closest("div[role='status']");
        expect(aviso).not.toBeNull();
        expect(aviso.querySelector("a")).toBeNull();
    });

    it("el botón «Cerrar aviso» descarta el aviso", () => {
        conSesionExpirada();
        montar();

        fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));

        expect(descartarAvisoSesion).toHaveBeenCalledTimes(1);
    });
});

describe("Layout: sombra del encabezado al desplazar", () => {
    it("empieza sin desplazamiento", () => {
        montar();

        expect(document.documentElement.dataset.desplazado).toBe("no");
    });

    it("marca la página como desplazada al bajar y vuelve a «no» al subir", () => {
        montar();

        window.scrollY = 120;
        fireEvent.scroll(window);
        expect(document.documentElement.dataset.desplazado).toBe("si");

        window.scrollY = 0;
        fireEvent.scroll(window);
        expect(document.documentElement.dataset.desplazado).toBe("no");
    });

    it("deja de escuchar el desplazamiento al desmontarse", () => {
        const { unmount } = montar();
        unmount();

        window.scrollY = 300;
        fireEvent.scroll(window);

        expect(document.documentElement.dataset.desplazado).toBe("no");
    });
});