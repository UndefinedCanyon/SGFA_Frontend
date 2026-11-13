import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/api", () => ({
    consultarFerias: vi.fn(),
    consultarEdicionesFeria: vi.fn(),
    consultarLugares: vi.fn(),
    consultarOcupacion: vi.fn(),
    solicitarParticipacion: vi.fn(),
    consultarParticipantes: vi.fn(),
    consultarMisSolicitudes: vi.fn(),
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../components/TarjetaEdicion", () => ({
    default: (p) => (
        <div data-testid="tarjeta">
            <span>{`${p.feria.nombreFeria}|${p.edicion ? `e${p.edicion.id}` : "sin-edicion"}`}</span>
            <span>{`rol:${p.rolUsuario ?? "nadie"}`}</span>
            <span>{`solicitud:${p.estadoSolicitud ?? "ninguna"}`}</span>
            <span>{`ocupacion:${p.ocupacion ? "si" : "no"}`}</span>
            <span>{`lugar:${p.lugar?.nombre ?? "ninguno"}`}</span>
            <span>{p.abierta ? "abierta" : "cerrada"}</span>
            <span>{`participantes:${p.participantes.length}`}</span>
            <span>{p.cargandoParticipantes ? "cargando-participantes" : ""}</span>
            <span>{p.solicitando ? "solicitando" : ""}</span>
            <span>{p.aviso ? `aviso:${p.aviso.tipo}:${p.aviso.texto}` : ""}</span>
            {p.edicion && <button onClick={p.onSolicitar}>{`solicitar-e${p.edicion.id}`}</button>}
            {p.edicion && <button onClick={p.onAlternar}>{`alternar-e${p.edicion.id}`}</button>}
        </div>
    ),
}));

import Ferias from "./Ferias";
import {
    consultarEdicionesFeria, consultarFerias, consultarLugares, consultarMisSolicitudes,
    consultarOcupacion, consultarParticipantes, solicitarParticipacion,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

const ferias = [
    { id: 1, nombreFeria: "Feria Andina" },
    { id: 2, nombreFeria: "Zeta" },
    { id: 3, nombreFeria: "Beta" },
];
const lugares = [{ id: 1, nombre: "Plaza Mayor", direccion: "Calle 1" }];
const ediciones = [
    { id: 1, idFeria: 1, idLugar: 1, fechaInicio: "2026-11-01", fechaFin: "2026-11-30" }, // en curso
    { id: 2, idFeria: 1, idLugar: 1, fechaInicio: "2026-11-02", fechaFin: "2026-11-15" }, // en curso, termina antes
    { id: 3, idFeria: 1, idLugar: 1, fechaInicio: "2026-12-01", fechaFin: "2026-12-03" }, // próxima
    { id: 4, idFeria: 1, idLugar: 1, fechaInicio: "2026-11-20", fechaFin: "2026-11-22" }, // próxima, empieza antes
    { id: 5, idFeria: 1, idLugar: 9, fechaInicio: "2026-10-01", fechaFin: "2026-10-03" }, // finalizada
    { id: 6, idFeria: 1, idLugar: 1, fechaInicio: "2026-10-10", fechaFin: "2026-10-20" }, // finalizada, termina después
    { id: 7, idFeria: 99, idLugar: 1, fechaInicio: "2026-11-01", fechaFin: "2026-11-30" }, // de una feria no visible
];

const ids = () => screen.getAllByTestId("tarjeta").map((t) => t.firstChild.textContent);

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 8, 12, 0, 0));
    useAuth.mockReturnValue({ usuario: null });
    consultarFerias.mockResolvedValue(ferias);
    consultarEdicionesFeria.mockResolvedValue(ediciones);
    consultarLugares.mockResolvedValue(lugares);
    consultarOcupacion.mockImplementation(async (id) => {
        if (id === 3) throw new Error("sin cupo");
        return { cupoMaximo: 10, aprobados: 1, disponibles: 9 };
    });
    consultarMisSolicitudes.mockResolvedValue([]);
    consultarParticipantes.mockResolvedValue([]);
    solicitarParticipacion.mockResolvedValue(undefined);
});
afterEach(() => vi.useRealTimers());

async function montar() {
    render(<Ferias />);
    await screen.findAllByTestId("tarjeta");
}

describe("Ferias: carga y orden", () => {
    it("muestra primero en curso, luego próximas, luego finalizadas y al final las ferias sin ediciones", async () => {
        await montar();

        expect(ids()).toEqual([
            "Feria Andina|e2",
            "Feria Andina|e1",
            "Feria Andina|e4",
            "Feria Andina|e3",
            "Feria Andina|e6",
            "Feria Andina|e5",
            "Beta|sin-edicion",
            "Zeta|sin-edicion",
        ]);
        expect(screen.getByText("8 resultados")).toBeInTheDocument();
    });

    it("ignora las ediciones de ferias que no están visibles", async () => {
        await montar();

        expect(screen.queryByText("Feria Andina|e7")).not.toBeInTheDocument();
        expect(consultarOcupacion).not.toHaveBeenCalledWith(7);
    });

    it("pasa a cada tarjeta su lugar y su ocupación, y tolera que el cupo falle", async () => {
        await montar();

        const tarjetas = screen.getAllByTestId("tarjeta");
        expect(tarjetas[1]).toHaveTextContent("ocupacion:si");
        expect(tarjetas[1]).toHaveTextContent("lugar:Plaza Mayor");
        expect(tarjetas[3]).toHaveTextContent("ocupacion:no");
        expect(tarjetas[5]).toHaveTextContent("lugar:ninguno");
    });

    it("mientras carga no muestra el conteo", () => {
        consultarFerias.mockReturnValue(new Promise(() => {}));
        render(<Ferias />);

        expect(screen.queryByText(/resultados?$/)).not.toBeInTheDocument();
    });

    it("sin ferias explica que aún no hay nada publicado", async () => {
        consultarFerias.mockResolvedValue([]);
        consultarEdicionesFeria.mockResolvedValue([]);
        render(<Ferias />);

        expect(await screen.findByText("Aún no hay ferias publicadas")).toBeInTheDocument();
        expect(screen.getByText("0 resultados")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Limpiar filtros" })).not.toBeInTheDocument();
    });

    it("un solo resultado usa el singular", async () => {
        consultarFerias.mockResolvedValue([ferias[0]]);
        consultarEdicionesFeria.mockResolvedValue([ediciones[0]]);
        render(<Ferias />);

        expect(await screen.findByText("1 resultado")).toBeInTheDocument();
    });

    it("si falla la carga permite reintentar", async () => {
        consultarFerias.mockRejectedValueOnce(new Error("Sin conexión."));
        render(<Ferias />);

        expect(await screen.findByText("No pudimos cargar las ferias")).toBeInTheDocument();
        expect(screen.getByText("Sin conexión.")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

        expect((await screen.findAllByTestId("tarjeta")).length).toBeGreaterThan(0);
    });
});

describe("Ferias: filtros", () => {
    it("busca por nombre de feria o de lugar sin importar tildes", async () => {
        await montar();

        fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "zeta" } });
        expect(ids()).toEqual(["Zeta|sin-edicion"]);

        fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "PLAZA" } });
        expect(screen.getAllByTestId("tarjeta")).toHaveLength(5);
    });

    it("filtra por estado y oculta las ferias sin ediciones", async () => {
        await montar();

        fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "PROXIMA" } });

        expect(ids()).toEqual(["Feria Andina|e4", "Feria Andina|e3"]);
    });

    it("filtra por fecha de realización", async () => {
        await montar();

        fireEvent.change(screen.getByLabelText("Fecha de realización"), { target: { value: "2026-12-02" } });

        expect(ids()).toEqual(["Feria Andina|e3"]);
    });

    it("sin coincidencias ofrece limpiar los filtros", async () => {
        await montar();

        fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "inexistente" } });

        expect(screen.getByText("No encontramos resultados")).toBeInTheDocument();
        const botones = screen.getAllByRole("button", { name: "Limpiar filtros" });
        fireEvent.click(botones[botones.length - 1]);

        expect(screen.getAllByTestId("tarjeta")).toHaveLength(8);
        expect(screen.getByLabelText("Buscar")).toHaveValue("");
    });

    it("el botón Limpiar filtros restablece todo", async () => {
        await montar();
        fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "FINALIZADA" } });

        fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));

        expect(screen.getByLabelText("Estado")).toHaveValue("TODAS");
        expect(screen.getAllByTestId("tarjeta")).toHaveLength(8);
    });
});

describe("Ferias: artesano", () => {
    beforeEach(() => {
        useAuth.mockReturnValue({ usuario: { rol: "ARTESANO", token: "tok" } });
    });

    it("consulta sus solicitudes y las asocia a cada edición", async () => {
        consultarMisSolicitudes.mockResolvedValue([{ idEdicionFeria: 1, estado: "APROBADA" }]);
        await montar();

        await waitFor(() => expect(screen.getByText("solicitud:APROBADA")).toBeInTheDocument());
        expect(consultarMisSolicitudes).toHaveBeenCalledWith("tok");
        expect(screen.getAllByText("rol:ARTESANO").length).toBeGreaterThan(0);
    });

    it("si no se pueden cargar sus solicitudes muestra el error", async () => {
        consultarMisSolicitudes.mockRejectedValue(new Error("No se pudieron cargar tus solicitudes."));
        await montar();

        expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron cargar tus solicitudes.");
    });

    it("solicitar participación marca la solicitud como pendiente y avisa", async () => {
        await montar();

        fireEvent.click(screen.getByText("solicitar-e1"));

        expect(await screen.findByText(/aviso:exito:Solicitud enviada/)).toBeInTheDocument();
        expect(solicitarParticipacion).toHaveBeenCalledWith(1, "tok");
        expect(screen.getByText("solicitud:PENDIENTE")).toBeInTheDocument();
    });

    it("si la solicitud falla avisa del error", async () => {
        solicitarParticipacion.mockRejectedValue(new Error("Ya solicitaste esta edición."));
        await montar();

        fireEvent.click(screen.getByText("solicitar-e1"));

        expect(await screen.findByText("aviso:error:Ya solicitaste esta edición.")).toBeInTheDocument();
    });
});

describe("Ferias: visitante", () => {
    it("no consulta solicitudes", async () => {
        await montar();

        expect(consultarMisSolicitudes).not.toHaveBeenCalled();
        expect(screen.getAllByText("rol:nadie").length).toBeGreaterThan(0);
    });
});

describe("Ferias: participantes", () => {
    it("abre una edición, carga los participantes y la cierra al repetir", async () => {
        consultarParticipantes.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        await montar();

        fireEvent.click(screen.getByText("alternar-e1"));
        expect((await screen.findAllByText("participantes:2")).length).toBeGreaterThan(0);
        expect(consultarParticipantes).toHaveBeenCalledWith(1);
        expect(screen.getByText("abierta")).toBeInTheDocument();

        fireEvent.click(screen.getByText("alternar-e1"));
        await waitFor(() => expect(screen.queryByText("abierta")).not.toBeInTheDocument());
        expect(screen.queryByText("participantes:2")).not.toBeInTheDocument();
    });

    it("si falla la carga de participantes avisa del error", async () => {
        consultarParticipantes.mockRejectedValue(new Error("No se pudo cargar."));
        await montar();

        fireEvent.click(screen.getByText("alternar-e1"));

        expect(await screen.findByText("aviso:error:No se pudo cargar.")).toBeInTheDocument();
    });
});
