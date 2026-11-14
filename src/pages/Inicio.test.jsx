import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/api", () => ({
    consultarFerias: vi.fn(),
    consultarEdicionesFeria: vi.fn(),
    consultarLugares: vi.fn(),
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../utils/fotos", () => ({ fotoDe: vi.fn() }));

import Inicio from "./Inicio";
import { consultarEdicionesFeria, consultarFerias, consultarLugares } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { fotoDe } from "../utils/fotos";

const ferias = [{ id: 1, nombreFeria: "Feria Andina" }, { id: 2, nombreFeria: "Feria Navideña" }];
const lugares = [{ id: 1, nombre: "Plaza Mayor" }];

function edicion(id, idFeria, inicio, fin, idLugar = 1) {
    return { id, idFeria, idLugar, fechaInicio: inicio, fechaFin: fin };
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 8, 12, 0, 0));
    useAuth.mockReturnValue({ usuario: null });
    fotoDe.mockReturnValue(null);
    consultarFerias.mockResolvedValue(ferias);
    consultarLugares.mockResolvedValue(lugares);
    consultarEdicionesFeria.mockResolvedValue([]);
});
afterEach(() => vi.useRealTimers());

function montar() {
    return render(
        <MemoryRouter>
            <Inicio />
        </MemoryRouter>
    );
}

describe("Inicio: fotos opcionales", () => {
    it("usa la foto de convocatoria en la franja final cuando existe", () => {
        fotoDe.mockImplementation((nombre) => (nombre === "convocatoria" ? "/assets/convocatoria-real.webp" : null));
        const { container } = montar();

        expect(fotoDe).toHaveBeenCalledWith("convocatoria");
        expect(container.innerHTML).toContain("convocatoria-real.webp");
    });

    it("sin foto, la franja final usa solo el degradado y el patrón", () => {
        const { container } = montar();

        expect(container.innerHTML).not.toContain("convocatoria-real.webp");
        expect(screen.getByRole("heading", { name: "¿Tienes un emprendimiento artesanal?" })).toBeInTheDocument();
    });
});

describe("Inicio: portada", () => {
    it("muestra el título, las instrucciones y los perfiles", () => {
        montar();

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Las ferias artesanales de Fusagasugá");
        expect(screen.getByRole("heading", { name: "¿Cómo funciona para los artesanos?" })).toBeInTheDocument();
        expect(screen.getByText("Crea tu cuenta")).toBeInTheDocument();
        expect(screen.getByText("Publica tus productos")).toBeInTheDocument();
        expect(screen.getByText("Solicita participar")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Un sistema para cada perfil" })).toBeInTheDocument();
        expect(screen.getByText("Visitantes")).toBeInTheDocument();
    });

    it("un visitante ve los enlaces para registrarse e iniciar sesión", () => {
        montar();

        expect(screen.getByRole("link", { name: "Ver ferias" })).toHaveAttribute("href", "/ferias");
        expect(screen.getByRole("link", { name: "Registrarme como artesano" })).toHaveAttribute("href", "/registro");
        expect(screen.getByRole("link", { name: "Crear mi cuenta" })).toHaveAttribute("href", "/registro");
        expect(screen.getByRole("link", { name: "Ya tengo cuenta" })).toHaveAttribute("href", "/login");
    });

    it.each([
        ["ADMINISTRADOR", "/admin"],
        ["ARTESANO", "/mi-panel"],
    ])("un usuario %s ve el enlace a su panel y no la invitación a registrarse", (rol, destino) => {
        useAuth.mockReturnValue({ usuario: { rol } });
        montar();

        expect(screen.getByRole("link", { name: "Ir a mi panel" })).toHaveAttribute("href", destino);
        expect(screen.queryByRole("link", { name: "Registrarme como artesano" })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Crear mi cuenta" })).not.toBeInTheDocument();
    });
});

describe("Inicio: próximas ediciones", () => {
    it("mientras carga no muestra mensajes de error ni de vacío", () => {
        consultarFerias.mockReturnValue(new Promise(() => {}));
        montar();

        expect(screen.queryByText(/Aún no hay ediciones programadas/)).not.toBeInTheDocument();
        expect(screen.queryByText(/No pudimos cargar/)).not.toBeInTheDocument();
    });

    it("sin ediciones lo explica", async () => {
        montar();

        expect(await screen.findByText(/Aún no hay ediciones programadas/)).toBeInTheDocument();
    });

    it("si falla la carga lo explica y remite a Ferias", async () => {
        consultarFerias.mockRejectedValue(new Error("fallo"));
        montar();

        expect(await screen.findByText(/No pudimos cargar las próximas ediciones/)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Ferias" })).toHaveAttribute("href", "/ferias");
    });

    it("muestra máximo tres, las más cercanas, sin finalizadas ni de ferias ocultas", async () => {
        consultarEdicionesFeria.mockResolvedValue([
            edicion(1, 1, "2026-12-20", "2026-12-22"),
            edicion(2, 1, "2026-11-01", "2026-11-30"),
            edicion(3, 2, "2026-12-01", "2026-12-03"),
            edicion(4, 1, "2027-02-01", "2027-02-03"),
            edicion(5, 1, "2026-10-01", "2026-10-03"),
            edicion(6, 99, "2026-11-10", "2026-11-12"),
        ]);
        montar();

        await screen.findByText("En curso");
        const tarjetas = screen.getAllByRole("article");
        const proximas = tarjetas.filter((t) => t.querySelector("h3")?.textContent.startsWith("Feria"));
        expect(proximas).toHaveLength(3);
        expect(proximas[0]).toHaveTextContent("En curso");
        expect(proximas[1]).toHaveTextContent("Próxima");
        expect(screen.queryByText("Feria #99")).not.toBeInTheDocument();
    });

    it("usa nombres de respaldo si falta la feria o el lugar", async () => {
        consultarFerias.mockResolvedValue([{ id: 1, nombreFeria: "Feria Andina" }]);
        consultarEdicionesFeria.mockResolvedValue([edicion(1, 1, "2026-12-01", "2026-12-03", 77)]);
        montar();

        expect(await screen.findByText("Lugar #77")).toBeInTheDocument();
    });
});
