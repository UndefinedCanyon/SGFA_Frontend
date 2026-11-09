import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/api", () => ({
    consultarTodasLasSolicitudes: vi.fn(),
    consultarTodosLosArtesanos: vi.fn(),
    consultarTodasLasFerias: vi.fn(),
    consultarLugares: vi.fn(),
    consultarTodasLasEdiciones: vi.fn(),
    consultarOcupacion: vi.fn(),
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../components/GestionSolicitudes", () => ({
    default: (p) => (
        <div>
            <span>{`solicitudes:${p.solicitudes.length}`}</span>
            <span>{`ocupaciones:${Object.keys(p.ocupaciones).length}`}</span>
            <button onClick={p.onCambio}>recargar-solicitudes</button>
        </div>
    ),
}));
vi.mock("../components/GestionFerias", () => ({ default: (p) => <span>{`ferias:${p.ferias.length}`}</span> }));
vi.mock("../components/GestionEdiciones", () => ({ default: (p) => <span>{`ediciones:${p.ediciones.length}`}</span> }));
vi.mock("../components/GestionArtesanos", () => ({ default: (p) => <span>{`artesanos:${p.artesanos.length}`}</span> }));
vi.mock("../components/GestionLugares", () => ({ default: (p) => <span>{`lugares:${p.lugares.length}`}</span> }));

import PanelAdministrador from "./PanelAdministrador";
import {
    consultarLugares, consultarOcupacion, consultarTodasLasEdiciones, consultarTodasLasFerias,
    consultarTodasLasSolicitudes, consultarTodosLosArtesanos,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ usuario: { nombre: "Admin SGFA", token: "tok" } });
    consultarTodasLasSolicitudes.mockResolvedValue([
        { id: 1, estado: "PENDIENTE" },
        { id: 2, estado: "PENDIENTE" },
        { id: 3, estado: "APROBADA" },
    ]);
    consultarTodosLosArtesanos.mockResolvedValue([{ id: 1, activo: true }, { id: 2, activo: false }]);
    consultarTodasLasFerias.mockResolvedValue([{ id: 1, activo: true }, { id: 2, activo: false }, { id: 3, activo: true }]);
    consultarLugares.mockResolvedValue([{ id: 1 }]);
    consultarTodasLasEdiciones.mockResolvedValue([{ id: 10, activo: true }, { id: 11, activo: false }]);
    consultarOcupacion.mockResolvedValue({ aprobados: 1 });
});

async function montar() {
    render(<PanelAdministrador />);
    await screen.findByText("solicitudes:3");
}

describe("PanelAdministrador", () => {
    it("saluda al administrador y carga todo con su token", async () => {
        await montar();

        expect(screen.getByText(/Hola, Admin SGFA/)).toBeInTheDocument();
        expect(consultarTodasLasSolicitudes).toHaveBeenCalledWith("tok");
        expect(consultarTodosLosArtesanos).toHaveBeenCalledWith("tok");
        expect(consultarTodasLasFerias).toHaveBeenCalledWith("tok");
        expect(consultarTodasLasEdiciones).toHaveBeenCalledWith("tok");
        expect(consultarOcupacion).toHaveBeenCalledWith(10);
        expect(consultarOcupacion).toHaveBeenCalledWith(11);
    });

    it("muestra las estadísticas calculadas", async () => {
        await montar();

        const valor = (etiqueta) => screen.getByText(etiqueta).nextElementSibling.textContent;
        expect(valor("Solicitudes pendientes")).toBe("2");
        expect(valor("Ferias activas")).toBe("2");
        expect(valor("Ediciones activas")).toBe("1");
        expect(valor("Artesanos activos")).toBe("1");
    });

    it("las pestañas llevan contadores cuando ya cargó", async () => {
        await montar();

        expect(screen.getByRole("tab", { name: /Solicitudes/ })).toHaveTextContent("2");
        expect(screen.getByRole("tab", { name: /Artesanos/ })).toHaveTextContent("2");
        expect(screen.getByRole("tab", { name: /Lugares/ })).toHaveTextContent("1");
        expect(screen.getByRole("tab", { name: /Ferias y ediciones/ })).toBeInTheDocument();
    });

    it("sin solicitudes pendientes la pestaña no muestra contador", async () => {
        consultarTodasLasSolicitudes.mockResolvedValue([{ id: 3, estado: "APROBADA" }]);
        render(<PanelAdministrador />);
        await screen.findByText("solicitudes:1");

        expect(screen.getByRole("tab", { name: "Solicitudes" })).toBeInTheDocument();
    });

    it("pasa los datos a cada sección y alterna entre pestañas", async () => {
        await montar();

        expect(screen.getByText("ocupaciones:2")).toBeInTheDocument();
        expect(screen.getByText("ferias:3")).toBeInTheDocument();
        expect(screen.getByText("ediciones:2")).toBeInTheDocument();
        expect(screen.getByText("artesanos:2")).toBeInTheDocument();
        expect(screen.getByText("lugares:1")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("tab", { name: /Artesanos/ }));
        expect(screen.getByRole("tab", { name: /Artesanos/ })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("tab", { name: /Solicitudes/ })).toHaveAttribute("aria-selected", "false");
    });

    it("si falla la carga muestra el error y permite reintentar", async () => {
        consultarTodasLasSolicitudes.mockRejectedValueOnce(new Error("Sin conexión."));
        render(<PanelAdministrador />);

        expect(await screen.findByRole("alert")).toHaveTextContent("Sin conexión.");

        fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

        await screen.findByText("solicitudes:3");
        await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    });

    it("las secciones pueden pedir que se recargue todo", async () => {
        await montar();
        consultarTodasLasSolicitudes.mockClear();

        fireEvent.click(screen.getByText("recargar-solicitudes"));

        await waitFor(() => expect(consultarTodasLasSolicitudes).toHaveBeenCalledTimes(1));
    });
});
