import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "./Header";
import { useAuth } from "../context/AuthContext";

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

let cerrarSesion;

beforeEach(() => {
    vi.clearAllMocks();
    cerrarSesion = vi.fn();
});

function montar(usuario = null) {
    useAuth.mockReturnValue({ usuario, cerrarSesion });
    return render(
        <MemoryRouter>
            <Header />
        </MemoryRouter>
    );
}

describe("Header", () => {
    it("siempre muestra el logo y los enlaces a inicio y ferias", () => {
        montar();

        expect(screen.getByAltText("SGFA")).toBeInTheDocument();
        expect(screen.getAllByRole("link", { name: "Inicio" })[0]).toHaveAttribute("href", "/");
        expect(screen.getByRole("link", { name: "Ferias" })).toHaveAttribute("href", "/ferias");
    });

    it("sin sesión ofrece registrarse e iniciar sesión", () => {
        montar(null);

        expect(screen.getByRole("link", { name: "Registrarse" })).toHaveAttribute("href", "/registro");
        expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
        expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
        expect(screen.queryByText(/Hola,/)).not.toBeInTheDocument();
    });

    it("un administrador ve su panel y su nombre", () => {
        montar({ nombre: "Marta", rol: "ADMINISTRADOR" });

        expect(screen.getByRole("link", { name: "Panel Admin" })).toHaveAttribute("href", "/admin");
        expect(screen.queryByRole("link", { name: "Mi Panel" })).not.toBeInTheDocument();
        expect(screen.getByText("Marta")).toBeInTheDocument();
    });

    it("un artesano ve su panel y su nombre", () => {
        montar({ nombre: "Luis", rol: "ARTESANO" });

        expect(screen.getByRole("link", { name: "Mi Panel" })).toHaveAttribute("href", "/mi-panel");
        expect(screen.queryByRole("link", { name: "Panel Admin" })).not.toBeInTheDocument();
        expect(screen.getByText("Luis")).toBeInTheDocument();
    });

    it("con sesión ya no muestra registrarse ni iniciar sesión", () => {
        montar({ nombre: "Luis", rol: "ARTESANO" });

        expect(screen.queryByRole("link", { name: "Registrarse" })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Iniciar sesión" })).not.toBeInTheDocument();
    });

    it("el botón «Cerrar sesión» cierra la sesión", () => {
        montar({ nombre: "Luis", rol: "ARTESANO" });

        fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

        expect(cerrarSesion).toHaveBeenCalledTimes(1);
    });
});