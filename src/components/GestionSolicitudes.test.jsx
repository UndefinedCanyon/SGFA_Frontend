import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { instalarDialogo } from "../test/dialogo";

vi.mock("../services/api", () => ({ aprobarSolicitud: vi.fn(), rechazarSolicitud: vi.fn() }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

import GestionSolicitudes from "./GestionSolicitudes";
import { aprobarSolicitud, rechazarSolicitud } from "../services/api";
import { useAuth } from "../context/AuthContext";

const artesanos = [
    { id: 1, nombre: "Ana Gómez", nombreEmprendimiento: "Cerámicas Ana", correoElectronico: "ana@correo.com", telefono: "300", activo: true },
    { id: 2, nombre: "Luis Pérez", nombreEmprendimiento: "Telares Luis", correoElectronico: "luis@correo.com", telefono: "", activo: false },
];
const ferias = [{ id: 1, nombreFeria: "Feria Andina" }];
const lugares = [{ id: 1, nombre: "Plaza Mayor" }];
const ediciones = [
    { id: 10, idFeria: 1, idLugar: 1, fechaInicio: "2026-12-01", fechaFin: "2026-12-03", activo: true },
    { id: 11, idFeria: 1, idLugar: 1, fechaInicio: "2027-01-01", fechaFin: "2027-01-02", activo: false },
];

const pendiente = { id: 100, idArtesano: 1, idEdicionFeria: 10, fechaInscripcion: "2026-11-02", estado: "PENDIENTE" };
const pendiente2 = { id: 101, idArtesano: 2, idEdicionFeria: 11, fechaInscripcion: "2026-11-01", estado: "PENDIENTE" };
const aprobada = { id: 102, idArtesano: 1, idEdicionFeria: 10, fechaInscripcion: "2026-10-20", estado: "APROBADA" };
const rechazada = { id: 103, idArtesano: 2, idEdicionFeria: 10, fechaInscripcion: "2026-10-25", estado: "RECHAZADA" };

let onCambio;

beforeEach(() => {
    vi.clearAllMocks();
    instalarDialogo();
    onCambio = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ usuario: { token: "tok" } });
    aprobarSolicitud.mockResolvedValue(undefined);
    rechazarSolicitud.mockResolvedValue(undefined);
});

function montar(solicitudes, extra = {}) {
    return render(
        <GestionSolicitudes
            solicitudes={solicitudes}
            artesanos={artesanos}
            ediciones={ediciones}
            ferias={ferias}
            lugares={lugares}
            ocupaciones={{}}
            cargando={false}
            onCambio={onCambio}
            {...extra}
        />
    );
}

const filtro = (nombre) => screen.getByRole("button", { name: new RegExp(`^${nombre}`) });

describe("GestionSolicitudes: lista y filtros", () => {
    it("muestra por defecto las pendientes, más antiguas primero, con los conteos", () => {
        montar([pendiente, pendiente2, aprobada, rechazada]);

        const titulos = screen.getAllByRole("heading", { level: 4 }).map((h) => h.textContent);
        expect(titulos).toEqual(["Telares Luis", "Cerámicas Ana"]);
        expect(filtro("Pendientes")).toHaveTextContent("2");
        expect(filtro("Aprobadas")).toHaveTextContent("1");
        expect(filtro("Todas")).toHaveTextContent("4");
        expect(filtro("Pendientes")).toHaveAttribute("aria-pressed", "true");
    });

    it("muestra los datos de la solicitud: artesano, feria, fechas, lugar y fecha de solicitud", () => {
        montar([pendiente]);

        expect(screen.getByText("Cerámicas Ana")).toBeInTheDocument();
        expect(screen.getByText("Ana Gómez")).toBeInTheDocument();
        expect(screen.getByText("ana@correo.com · 300")).toBeInTheDocument();
        expect(screen.getByText("Feria Andina")).toBeInTheDocument();
        expect(screen.getByText(/Plaza Mayor/)).toBeInTheDocument();
        expect(screen.getByText(/Solicitada el/)).toBeInTheDocument();
    });

    it("marca las ediciones inactivas y los artesanos inactivos", () => {
        montar([pendiente2]);

        expect(screen.getByText("Edición inactiva")).toBeInTheDocument();
        expect(screen.getByText("Luis Pérez (inactivo)")).toBeInTheDocument();
        expect(screen.getByText("luis@correo.com")).toBeInTheDocument();
    });

    it("usa nombres de respaldo si faltan el artesano, la feria, el lugar o la edición", () => {
        montar(
            [
                { id: 200, idArtesano: 99, idEdicionFeria: 12, fechaInscripcion: "2026-11-01", estado: "PENDIENTE" },
                { id: 201, idArtesano: 1, idEdicionFeria: 13, fechaInscripcion: "2026-11-02", estado: "PENDIENTE" },
            ],
            { ediciones: [...ediciones, { id: 13, idFeria: 7, idLugar: 8, fechaInicio: "2027-02-01", fechaFin: "2027-02-02", activo: true }] }
        );

        expect(screen.getByText("Artesano #99")).toBeInTheDocument();
        expect(screen.getByText("Edición #12")).toBeInTheDocument();
        expect(screen.getByText("No se encontró la edición.")).toBeInTheDocument();
        expect(screen.getByText("Feria #7")).toBeInTheDocument();
        expect(screen.getByText(/Lugar #8/)).toBeInTheDocument();
    });

    it("el filtro Aprobadas muestra solo las aprobadas, y Todas las ordena por estado", () => {
        montar([pendiente, aprobada, rechazada]);

        fireEvent.click(filtro("Aprobadas"));
        expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(1);

        fireEvent.click(filtro("Todas"));
        const estados = screen.getAllByRole("article").map((a) => a.textContent);
        expect(estados[0]).toContain("Pendiente");
        expect(estados[1]).toContain("Aprobada");
        expect(estados[2]).toContain("Rechazada");
    });

    it("las rechazadas se ordenan de la más reciente a la más antigua", () => {
        const otra = { ...rechazada, id: 104, idArtesano: 1, fechaInscripcion: "2026-10-30" };
        montar([rechazada, otra]);

        fireEvent.click(filtro("Rechazadas"));

        const titulos = screen.getAllByRole("heading", { level: 4 }).map((h) => h.textContent);
        expect(titulos).toEqual(["Cerámicas Ana", "Telares Luis"]);
    });

    it("mientras carga muestra esqueletos", () => {
        montar([pendiente], { cargando: true });

        expect(screen.queryByRole("article")).not.toBeInTheDocument();
        expect(screen.queryByText(/No hay solicitudes/)).not.toBeInTheDocument();
    });

    it("explica los distintos estados vacíos", () => {
        const { unmount } = montar([]);
        expect(screen.getByText("Aún no hay solicitudes")).toBeInTheDocument();
        unmount();

        montar([aprobada]);
        expect(screen.getByText("No hay solicitudes pendientes")).toBeInTheDocument();
        fireEvent.click(filtro("Rechazadas"));
        expect(screen.getByText("No hay solicitudes en este estado")).toBeInTheDocument();
    });
});

describe("GestionSolicitudes: acciones", () => {
    it("aprobar una pendiente llama a la API, avisa y refresca", async () => {
        montar([pendiente]);

        fireEvent.click(screen.getByRole("button", { name: "Aprobar" }));

        await waitFor(() => expect(aprobarSolicitud).toHaveBeenCalledWith(100, "tok"));
        expect(await screen.findByText(/Solicitud de "Cerámicas Ana" aprobada/)).toBeInTheDocument();
        expect(onCambio).toHaveBeenCalledTimes(1);
    });

    it("rechazar una pendiente no pide confirmación", async () => {
        montar([pendiente]);

        fireEvent.click(screen.getByRole("button", { name: "Rechazar" }));

        await waitFor(() => expect(rechazarSolicitud).toHaveBeenCalledWith(100, "tok"));
        expect(await screen.findByText(/Solicitud de "Cerámicas Ana" rechazada/)).toBeInTheDocument();
    });

    it("una rechazada puede aprobarse de nuevo", async () => {
        montar([rechazada]);
        fireEvent.click(filtro("Rechazadas"));

        fireEvent.click(screen.getByRole("button", { name: "Aprobar" }));

        await waitFor(() => expect(aprobarSolicitud).toHaveBeenCalledWith(103, "tok"));
    });

    it("cambiar una aprobada a rechazada pide confirmación", async () => {
        montar([aprobada]);
        fireEvent.click(filtro("Aprobadas"));

        fireEvent.click(screen.getByRole("button", { name: "Cambiar a rechazada" }));
        const dialogo = screen.getByRole("dialog");
        expect(within(dialogo).getByText("¿Cambiar a rechazada?")).toBeInTheDocument();
        expect(within(dialogo).getByText(/ya aprobada de "Cerámicas Ana"/)).toBeInTheDocument();

        fireEvent.click(within(dialogo).getByRole("button", { name: "Rechazar" }));

        await waitFor(() => expect(rechazarSolicitud).toHaveBeenCalledWith(102, "tok"));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("cancelar la confirmación no rechaza", () => {
        montar([aprobada]);
        fireEvent.click(filtro("Aprobadas"));
        fireEvent.click(screen.getByRole("button", { name: "Cambiar a rechazada" }));

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(rechazarSolicitud).not.toHaveBeenCalled();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("si la API falla muestra el error", async () => {
        aprobarSolicitud.mockRejectedValue(new Error("No quedan cupos."));
        montar([pendiente]);

        fireEvent.click(screen.getByRole("button", { name: "Aprobar" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("No quedan cupos.");
        expect(onCambio).not.toHaveBeenCalled();
    });
});

describe("GestionSolicitudes: cupos", () => {
    it("muestra el cupo usado y no avisa si todavía hay lugar", () => {
        montar([pendiente], { ocupaciones: { 10: { cupoMaximo: 5, aprobados: 2, disponibles: 3 } } });

        expect(screen.getByText("Cupo: 2 de 5")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Aprobar" })).toBeEnabled();
    });

    it("con el cupo lleno avisa y no deja aprobar", () => {
        montar([pendiente], { ocupaciones: { 10: { cupoMaximo: 5, aprobados: 5, disponibles: 0 } } });

        expect(screen.getByText("Cupo: 5 de 5 · completo")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Aprobar" })).toBeDisabled();
    });

    it("a una solicitud ya aprobada no le repite el aviso de cupo completo", () => {
        montar([aprobada], { ocupaciones: { 10: { cupoMaximo: 1, aprobados: 1, disponibles: 0 } } });
        fireEvent.click(filtro("Aprobadas"));

        expect(screen.getByText("Cupo: 1 de 1")).toBeInTheDocument();
    });

    it("sin límite de cupo no muestra nada", () => {
        montar([pendiente], { ocupaciones: { 10: { cupoMaximo: null, aprobados: 4, disponibles: null } } });

        expect(screen.queryByText(/^Cupo:/)).not.toBeInTheDocument();
    });
});
