import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { instalarDialogo } from "../test/dialogo";

vi.mock("../services/api", () => ({
    crearEdicionFeria: vi.fn(),
    cambiarEstadoEdicion: vi.fn(),
    configurarCupoEdicion: vi.fn(),
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("./BarraCupo", () => ({
    default: ({ ocupacion }) => <div data-testid="cupo">{ocupacion ? `cupo:${ocupacion.aprobados}` : "sin-cupo"}</div>,
}));

import GestionEdiciones from "./GestionEdiciones";
import { cambiarEstadoEdicion, configurarCupoEdicion, crearEdicionFeria } from "../services/api";
import { useAuth } from "../context/AuthContext";

const ferias = [
    { id: 1, nombreFeria: "Feria Andina", activo: true },
    { id: 2, nombreFeria: "Feria Vieja", activo: false },
];
const lugares = [
    { id: 1, nombre: "Plaza Mayor", direccion: "Calle 1", activo: true },
    { id: 2, nombre: "Parque", direccion: "", activo: false },
];

const enCursoA = { id: 1, idFeria: 1, idLugar: 1, fechaInicio: "2026-11-01", fechaFin: "2026-11-30", activo: true, cupoMaximo: 20 };
const enCursoB = { id: 2, idFeria: 1, idLugar: 1, fechaInicio: "2026-11-02", fechaFin: "2026-11-15", activo: true, cupoMaximo: null };
const proximaA = { id: 3, idFeria: 1, idLugar: 1, fechaInicio: "2026-12-01", fechaFin: "2026-12-03", activo: true, cupoMaximo: null };
const proximaB = { id: 4, idFeria: 2, idLugar: 2, fechaInicio: "2026-11-20", fechaFin: "2026-11-22", activo: true, cupoMaximo: null };
const finalizadaA = { id: 5, idFeria: 1, idLugar: 1, fechaInicio: "2026-10-01", fechaFin: "2026-10-03", activo: true, cupoMaximo: null };
const finalizadaB = { id: 6, idFeria: 1, idLugar: 1, fechaInicio: "2026-10-10", fechaFin: "2026-10-20", activo: true, cupoMaximo: null };
const inactiva = { id: 7, idFeria: 99, idLugar: 99, fechaInicio: "2027-01-01", fechaFin: "2027-01-02", activo: false, cupoMaximo: null };

const todas = [enCursoA, enCursoB, proximaA, proximaB, finalizadaA, finalizadaB, inactiva];

let onCambio;

beforeEach(() => {
    vi.clearAllMocks();
    instalarDialogo();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 8, 12, 0, 0));
    onCambio = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ usuario: { token: "tok" } });
    crearEdicionFeria.mockResolvedValue(undefined);
    cambiarEstadoEdicion.mockResolvedValue(undefined);
    configurarCupoEdicion.mockResolvedValue(undefined);
});
afterEach(() => vi.useRealTimers());

function montar(ediciones = todas, extra = {}) {
    return render(
        <GestionEdiciones
            ferias={ferias}
            lugares={lugares}
            ediciones={ediciones}
            ocupaciones={{ 1: { aprobados: 3 } }}
            cargando={false}
            onCambio={onCambio}
            {...extra}
        />
    );
}

const ordenIds = () =>
    screen.getAllByRole("article").map((a) => {
        const fechas = a.querySelector("dd").textContent;
        return fechas;
    });

describe("GestionEdiciones: lista", () => {
    it("ordena en curso, próximas, finalizadas e inactivas", () => {
        montar();

        const etiquetas = screen.getAllByRole("article").map((a) => {
            const insignias = ["En curso", "Próxima", "Finalizada", "Inactiva"].filter((t) => within(a).queryByText(t));
            return insignias[0];
        });
        expect(etiquetas).toEqual([
            "En curso", "En curso", "Próxima", "Próxima", "Finalizada", "Finalizada", "Inactiva",
        ]);
        expect(screen.getByText("7 ediciones")).toBeInTheDocument();
    });

    it("dentro de cada grupo respeta el orden por fechas", () => {
        montar();

        const fechas = ordenIds();
        // en curso: termina antes primero; próximas: empieza antes primero; finalizadas: terminó después primero
        expect(fechas[0]).toContain("15");
        expect(fechas[2]).toContain("20");
        expect(fechas[4]).toContain("20");
    });

    it("muestra la barra de cupo de cada edición y los datos del lugar", () => {
        montar([enCursoA]);

        expect(screen.getByTestId("cupo")).toHaveTextContent("cupo:3");
        expect(screen.getByText("Plaza Mayor")).toBeInTheDocument();
        expect(screen.getByText("Calle 1")).toBeInTheDocument();
    });

    it("avisa cuando la feria está inactiva y usa nombres de respaldo si faltan feria o lugar", () => {
        montar([proximaB, inactiva]);

        expect(screen.getByText("Feria inactiva")).toBeInTheDocument();
        expect(screen.getByText("Feria #99")).toBeInTheDocument();
        expect(screen.getByText("Lugar #99")).toBeInTheDocument();
    });

    it("un solo resultado usa el singular", () => {
        montar([enCursoA]);

        expect(screen.getByText("1 edición")).toBeInTheDocument();
    });

    it("mientras carga no muestra el conteo", () => {
        montar([], { cargando: true });

        expect(screen.queryByText(/^\d+ ediciones?$/)).not.toBeInTheDocument();
    });

    it("sin ediciones invita a crear la primera", () => {
        montar([]);

        expect(screen.getByText("Aún no hay ediciones")).toBeInTheDocument();
    });
});

describe("GestionEdiciones: búsqueda y filtro", () => {
    it("busca por feria o por lugar", () => {
        montar();

        fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "vieja" } });
        expect(screen.getAllByRole("article")).toHaveLength(1);

        fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "PLAZA" } });
        expect(screen.getAllByRole("article")).toHaveLength(5);
    });

    it("filtra por estado, incluidas las inactivas", () => {
        montar();

        fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "INACTIVA" } });
        expect(screen.getAllByRole("article")).toHaveLength(1);

        fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "FINALIZADA" } });
        expect(screen.getAllByRole("article")).toHaveLength(2);
    });

    it("sin coincidencias lo explica", () => {
        montar();

        fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "zzz" } });

        expect(screen.getByText("No encontramos ediciones")).toBeInTheDocument();
    });
});

describe("GestionEdiciones: crear", () => {
    const abrir = () => fireEvent.click(screen.getByRole("button", { name: "+ Crear edición" }));

    function llenar(inicio = "2026-12-10", fin = "2026-12-12") {
        fireEvent.change(screen.getByLabelText("Feria"), { target: { name: "idFeria", value: "1" } });
        fireEvent.change(screen.getByLabelText("Lugar"), { target: { name: "idLugar", value: "1" } });
        fireEvent.change(screen.getByLabelText("Fecha de inicio"), { target: { name: "fechaInicio", value: inicio } });
        fireEvent.change(screen.getByLabelText("Fecha de fin"), { target: { name: "fechaFin", value: fin } });
    }

    it("el botón abre y cierra el formulario, que solo ofrece ferias y lugares activos", () => {
        montar();
        abrir();

        const feria = screen.getByLabelText("Feria");
        expect(within(feria).getAllByRole("option").map((o) => o.textContent)).toEqual([
            "Selecciona una feria", "Feria Andina",
        ]);
        expect(within(screen.getByLabelText("Lugar")).getAllByRole("option").map((o) => o.textContent)).toEqual([
            "Selecciona un lugar", "Plaza Mayor",
        ]);

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
        expect(screen.queryByLabelText("Fecha de inicio")).not.toBeInTheDocument();
    });

    it("sin ferias activas o sin lugares activos explica por qué no se puede crear", () => {
        render(
            <GestionEdiciones ferias={[ferias[1]]} lugares={lugares} ediciones={[]} ocupaciones={{}} cargando={false} onCambio={onCambio} />
        );
        abrir();

        expect(screen.getByText(/primero necesitas al menos una feria activa y un lugar registrado/)).toBeInTheDocument();
        expect(screen.queryByLabelText("Fecha de inicio")).not.toBeInTheDocument();
    });

    it("crea la edición con los datos convertidos, avisa, cierra y refresca", async () => {
        montar([]);
        abrir();
        llenar();

        fireEvent.click(screen.getByRole("button", { name: "Crear edición" }));

        expect(await screen.findByText(/Edición creada/)).toBeInTheDocument();
        expect(crearEdicionFeria).toHaveBeenCalledWith(
            { idFeria: 1, idLugar: 1, fechaInicio: "2026-12-10", fechaFin: "2026-12-12" },
            "tok"
        );
        expect(onCambio).toHaveBeenCalledTimes(1);
        expect(screen.queryByLabelText("Fecha de inicio")).not.toBeInTheDocument();
    });

    it("rechaza una fecha de fin anterior a la de inicio", () => {
        montar([]);
        abrir();
        llenar("2026-12-10", "2026-12-01");

        fireEvent.submit(screen.getByLabelText("Fecha de inicio").closest("form"));

        expect(screen.getByRole("alert")).toHaveTextContent("La fecha de fin no puede ser anterior a la fecha de inicio.");
        expect(crearEdicionFeria).not.toHaveBeenCalled();
    });

    it("si el servidor falla muestra el error", async () => {
        crearEdicionFeria.mockRejectedValue(new Error("El lugar no está disponible."));
        montar([]);
        abrir();
        llenar();

        fireEvent.click(screen.getByRole("button", { name: "Crear edición" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("El lugar no está disponible.");
    });
});

describe("GestionEdiciones: cupo", () => {
    const abrirCupo = () => fireEvent.click(screen.getAllByRole("button", { name: "Configurar cupo" })[0]);

    it("muestra el cupo actual en el campo", () => {
        montar([enCursoA]);
        abrirCupo();

        expect(screen.getByLabelText("Cupo máximo de artesanos")).toHaveValue(20);
    });

    it("guarda un nuevo cupo", async () => {
        montar([enCursoA]);
        abrirCupo();

        fireEvent.change(screen.getByLabelText("Cupo máximo de artesanos"), { target: { value: "35" } });
        fireEvent.click(screen.getByRole("button", { name: "Guardar cupo" }));

        expect(await screen.findByText("Cupo actualizado a 35 artesanos.")).toBeInTheDocument();
        expect(configurarCupoEdicion).toHaveBeenCalledWith(1, 35, "tok");
        expect(onCambio).toHaveBeenCalledTimes(1);
    });

    it("un campo vacío quita el límite", async () => {
        montar([enCursoB]);
        abrirCupo();

        fireEvent.click(screen.getByRole("button", { name: "Guardar cupo" }));

        expect(await screen.findByText("Se quitó el límite de cupo.")).toBeInTheDocument();
        expect(configurarCupoEdicion).toHaveBeenCalledWith(2, null, "tok");
    });

    it("si falla muestra el error", async () => {
        configurarCupoEdicion.mockRejectedValue(new Error("El cupo es menor que los aprobados."));
        montar([enCursoA]);
        abrirCupo();

        fireEvent.click(screen.getByRole("button", { name: "Guardar cupo" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("El cupo es menor que los aprobados.");
    });

    it("cancelar cierra el campo sin guardar", () => {
        montar([enCursoA]);
        abrirCupo();

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(screen.queryByLabelText("Cupo máximo de artesanos")).not.toBeInTheDocument();
        expect(configurarCupoEdicion).not.toHaveBeenCalled();
    });
});

describe("GestionEdiciones: estado", () => {
    it("desactivar pide confirmación con las fechas y el nombre de la feria", async () => {
        montar([enCursoA]);

        fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));
        const dialogo = screen.getByRole("dialog");
        expect(within(dialogo).getByText("¿Desactivar esta edición?")).toBeInTheDocument();
        expect(within(dialogo).getByText(/de "Feria Andina" dejará de mostrarse al público/)).toBeInTheDocument();
        fireEvent.click(within(dialogo).getByRole("button", { name: "Desactivar" }));

        await waitFor(() => expect(cambiarEstadoEdicion).toHaveBeenCalledWith(1, false, "tok"));
        expect(await screen.findByText(/Edición desactivada/)).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("el aviso de desactivación usa Feria # si la feria no existe", () => {
        montar([inactiva, { ...enCursoA, idFeria: 77 }]);

        fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));

        expect(screen.getByRole("dialog")).toHaveTextContent('"Feria #77"');
    });

    it("cancelar la confirmación no desactiva", () => {
        montar([enCursoA]);
        fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));

        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }));

        expect(cambiarEstadoEdicion).not.toHaveBeenCalled();
    });

    it("reactivar no pide confirmación", async () => {
        montar([inactiva]);

        fireEvent.click(screen.getByRole("button", { name: "Reactivar" }));

        await waitFor(() => expect(cambiarEstadoEdicion).toHaveBeenCalledWith(7, true, "tok"));
        expect(await screen.findByText("Edición reactivada.")).toBeInTheDocument();
    });

    it("si falla muestra el error", async () => {
        cambiarEstadoEdicion.mockRejectedValue(new Error("Sin permiso."));
        montar([inactiva]);

        fireEvent.click(screen.getByRole("button", { name: "Reactivar" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Sin permiso.");
    });
});
