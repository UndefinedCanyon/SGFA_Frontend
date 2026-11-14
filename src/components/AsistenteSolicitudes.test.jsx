import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/api", () => ({ analizarSolicitudesDeEdicion: vi.fn() }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

import AsistenteSolicitudes from "./AsistenteSolicitudes";
import { analizarSolicitudesDeEdicion } from "../services/api";
import { useAuth } from "../context/AuthContext";

const ferias = [{ id: 1, nombreFeria: "Feria Andina" }];
const lugares = [{ id: 1, nombre: "Plaza Mayor" }];
const ediciones = [
    { id: 10, idFeria: 1, idLugar: 1, fechaInicio: "2026-12-01", fechaFin: "2026-12-03" },
    { id: 11, idFeria: 1, idLugar: 1, fechaInicio: "2027-03-01", fechaFin: "2027-03-04" },
];
const pend = (id, edicion) => ({ id, idArtesano: 1, idEdicionFeria: edicion, estado: "PENDIENTE", fechaInscripcion: "2026-11-01" });

const resultado = (extra = {}) => ({
    idEdicionFeria: 10,
    resumen: "Hay dos solicitudes y tres cupos.",
    cuposDisponibles: 3,
    totalPendientes: 2,
    analizadas: 2,
    proveedor: "Gemini",
    sugerencias: [{ idInscripcion: 1, prioridad: "ALTA", motivo: "ok" }],
    ...extra,
});

let onAnalisis;

beforeEach(() => {
    vi.clearAllMocks();
    onAnalisis = vi.fn();
    useAuth.mockReturnValue({ usuario: { token: "tok" } });
    analizarSolicitudesDeEdicion.mockResolvedValue(resultado());
});

function montar(solicitudes) {
    return render(
        <AsistenteSolicitudes
            solicitudes={solicitudes}
            ediciones={ediciones}
            ferias={ferias}
            lugares={lugares}
            onAnalisis={onAnalisis}
        />
    );
}

const selector = () => screen.getByLabelText("Edición a analizar");
const botonAnalizar = () => screen.getByRole("button", { name: /Analizar con IA|Analizando/ });

describe("AsistenteSolicitudes: opciones", () => {
    it("sin solicitudes pendientes lo explica y no ofrece analizar", () => {
        montar([{ ...pend(1, 10), estado: "APROBADA" }]);

        expect(screen.getByText("No hay solicitudes pendientes para analizar.")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Analizar con IA" })).not.toBeInTheDocument();
    });

    it("lista solo las ediciones con pendientes, con su conteo, las que tienen más primero", () => {
        montar([pend(1, 10), pend(2, 11), pend(3, 11), { ...pend(4, 10), estado: "RECHAZADA" }]);

        const textos = within(selector()).getAllByRole("option").map((o) => o.textContent);
        expect(textos).toEqual([
            "Selecciona una edición",
            "Feria Andina · 01/03/2027 al 04/03/2027 · Plaza Mayor (2 pendientes)",
            "Feria Andina · 01/12/2026 al 03/12/2026 · Plaza Mayor (1 pendiente)",
        ]);
    });

    it("con el mismo conteo ordena por id de edición", () => {
        montar([pend(1, 11), pend(2, 10)]);

        const textos = within(selector()).getAllByRole("option").map((o) => o.textContent);
        expect(textos[1]).toContain("01/12/2026");
    });

    it("sin elegir edición el botón está deshabilitado", () => {
        montar([pend(1, 10)]);

        expect(botonAnalizar()).toBeDisabled();
    });
});

describe("AsistenteSolicitudes: análisis", () => {
    it("analiza la edición elegida con el token y muestra el resultado", async () => {
        montar([pend(1, 10), pend(2, 10)]);

        fireEvent.change(selector(), { target: { value: "10" } });
        fireEvent.click(botonAnalizar());

        expect(await screen.findByRole("heading", { name: "Análisis del asistente" })).toBeInTheDocument();
        expect(analizarSolicitudesDeEdicion).toHaveBeenCalledWith(10, "tok");
        expect(screen.getByText("Generado por Gemini")).toBeInTheDocument();
        expect(screen.getByText("Hay dos solicitudes y tres cupos.")).toBeInTheDocument();
        expect(screen.getByText(/Cupos disponibles: 3\./)).toBeInTheDocument();
        expect(screen.getByText(/Analizadas 2 de 2 pendientes\./)).toBeInTheDocument();
        expect(screen.getByText(/revísala antes de decidir/)).toBeInTheDocument();
        expect(onAnalisis).toHaveBeenLastCalledWith(resultado());
    });

    it("mientras analiza deshabilita el selector y el botón", async () => {
        let terminar;
        analizarSolicitudesDeEdicion.mockReturnValue(new Promise((resolver) => { terminar = resolver; }));
        montar([pend(1, 10)]);
        fireEvent.change(selector(), { target: { value: "10" } });

        fireEvent.click(botonAnalizar());

        expect(await screen.findByRole("button", { name: "Analizando..." })).toBeDisabled();
        expect(selector()).toBeDisabled();

        terminar(resultado());
        await screen.findByRole("heading", { name: "Análisis del asistente" });
        expect(selector()).not.toBeDisabled();
    });

    it("el modo demostración se anuncia como sin IA", async () => {
        analizarSolicitudesDeEdicion.mockResolvedValue(resultado({ proveedor: "Demostración" }));
        montar([pend(1, 10)]);
        fireEvent.change(selector(), { target: { value: "10" } });

        fireEvent.click(botonAnalizar());

        expect(await screen.findByText("Demostración (sin IA)")).toBeInTheDocument();
    });

    it("sin límite de cupo lo dice, y avisa cuando solo se analizó una parte", async () => {
        analizarSolicitudesDeEdicion.mockResolvedValue(
            resultado({ cuposDisponibles: null, totalPendientes: 20, analizadas: 15 })
        );
        montar([pend(1, 10)]);
        fireEvent.change(selector(), { target: { value: "10" } });

        fireEvent.click(botonAnalizar());

        expect(await screen.findByText(/Sin límite de cupo\./)).toBeInTheDocument();
        expect(screen.getByText(/Analizadas 15 de 20 pendientes\. Solo se analizan las más antiguas/)).toBeInTheDocument();
    });

    it("si falla muestra el error y no deja un análisis a medias", async () => {
        analizarSolicitudesDeEdicion.mockRejectedValue(new Error("Se alcanzó el límite gratuito."));
        montar([pend(1, 10)]);
        fireEvent.change(selector(), { target: { value: "10" } });

        fireEvent.click(botonAnalizar());

        expect(await screen.findByRole("alert")).toHaveTextContent("Se alcanzó el límite gratuito.");
        expect(screen.queryByRole("heading", { name: "Análisis del asistente" })).not.toBeInTheDocument();
        expect(onAnalisis).toHaveBeenLastCalledWith(null);
    });

    it("un análisis nuevo borra el error anterior", async () => {
        analizarSolicitudesDeEdicion.mockRejectedValueOnce(new Error("Falló"));
        montar([pend(1, 10)]);
        fireEvent.change(selector(), { target: { value: "10" } });
        fireEvent.click(botonAnalizar());
        await screen.findByRole("alert");

        fireEvent.click(botonAnalizar());

        await screen.findByRole("heading", { name: "Análisis del asistente" });
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("cambiar de edición descarta el análisis y el error", async () => {
        montar([pend(1, 10), pend(2, 11)]);
        fireEvent.change(selector(), { target: { value: "10" } });
        fireEvent.click(botonAnalizar());
        await screen.findByRole("heading", { name: "Análisis del asistente" });

        fireEvent.change(selector(), { target: { value: "11" } });

        expect(screen.queryByRole("heading", { name: "Análisis del asistente" })).not.toBeInTheDocument();
        expect(onAnalisis).toHaveBeenLastCalledWith(null);
    });

    it("Cerrar análisis lo oculta y avisa al padre", async () => {
        montar([pend(1, 10)]);
        fireEvent.change(selector(), { target: { value: "10" } });
        fireEvent.click(botonAnalizar());
        await screen.findByRole("heading", { name: "Análisis del asistente" });

        fireEvent.click(screen.getByRole("button", { name: "Cerrar análisis" }));

        expect(screen.queryByRole("heading", { name: "Análisis del asistente" })).not.toBeInTheDocument();
        expect(onAnalisis).toHaveBeenLastCalledWith(null);
    });

    it("si la edición elegida deja de tener pendientes, se deselecciona", async () => {
        const { rerender } = montar([pend(1, 10), pend(2, 11)]);
        fireEvent.change(selector(), { target: { value: "10" } });
        expect(selector()).toHaveValue("10");

        rerender(
            <AsistenteSolicitudes
                solicitudes={[pend(2, 11)]}
                ediciones={ediciones}
                ferias={ferias}
                lugares={lugares}
                onAnalisis={onAnalisis}
            />
        );

        await waitFor(() => expect(selector()).toHaveValue(""));
        expect(botonAnalizar()).toBeDisabled();
    });
});
