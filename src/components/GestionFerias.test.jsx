import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { instalarDialogo } from "../test/dialogo";

vi.mock("../services/api", () => ({
    crearFeria: vi.fn(),
    actualizarFeria: vi.fn(),
    cambiarEstadoFeria: vi.fn(),
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

import GestionFerias from "./GestionFerias";
import { actualizarFeria, cambiarEstadoFeria, crearFeria } from "../services/api";
import { useAuth } from "../context/AuthContext";

const andina = { id: 1, nombreFeria: "Feria Andina", activo: true };
const navidena = { id: 2, nombreFeria: "Feria Navideña", activo: false };
const alamos = { id: 3, nombreFeria: "Álamos", activo: true };
const ediciones = [
    { id: 10, idFeria: 1, activo: true },
    { id: 11, idFeria: 1, activo: true },
    { id: 12, idFeria: 3, activo: true },
    { id: 13, idFeria: 3, activo: false },
];

let onCambio;

beforeEach(() => {
    vi.clearAllMocks();
    instalarDialogo();
    onCambio = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ usuario: { id: 5, token: "tok" } });
    crearFeria.mockResolvedValue({ nombreFeria: "Feria Nueva" });
    actualizarFeria.mockResolvedValue(undefined);
    cambiarEstadoFeria.mockResolvedValue(undefined);
});

function montar(ferias = [andina, navidena, alamos], cargando = false) {
    return render(<GestionFerias ferias={ferias} ediciones={ediciones} cargando={cargando} onCambio={onCambio} />);
}

describe("GestionFerias: lista", () => {
    it("muestra las activas primero, ordenadas por nombre", () => {
        montar();

        const nombres = screen.getAllByText(/^(Feria Andina|Feria Navideña|Álamos)$/).map((e) => e.textContent);
        expect(nombres).toEqual(["Álamos", "Feria Andina", "Feria Navideña"]);
        expect(screen.getByText("Inactiva")).toBeInTheDocument();
    });

    it("cuenta las ediciones activas con singular y plural", () => {
        montar();

        expect(screen.getByText("2 ediciones activas")).toBeInTheDocument();
        expect(screen.getByText("1 edición activa")).toBeInTheDocument();
        expect(screen.getByText("Sin ediciones")).toBeInTheDocument();
    });

    it("mientras carga no muestra la lista ni el estado vacío", () => {
        montar([], true);

        expect(screen.queryByText("Aún no hay ferias")).not.toBeInTheDocument();
    });

    it("sin ferias invita a crear la primera", () => {
        montar([]);

        expect(screen.getByText("Aún no hay ferias")).toBeInTheDocument();
    });
});

describe("GestionFerias: crear", () => {
    function abrirFormulario() {
        fireEvent.click(screen.getByRole("button", { name: "+ Crear feria" }));
    }

    it("el botón abre y cierra el formulario", () => {
        montar();
        abrirFormulario();
        expect(screen.getByLabelText("Nombre de la feria")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
        expect(screen.queryByLabelText("Nombre de la feria")).not.toBeInTheDocument();
    });

    it("crea la feria a nombre del administrador, avisa, cierra el formulario y refresca", async () => {
        montar();
        abrirFormulario();

        fireEvent.change(screen.getByLabelText("Nombre de la feria"), { target: { value: "  Feria Nueva  " } });
        fireEvent.click(screen.getByRole("button", { name: "Crear feria" }));

        expect(await screen.findByText(/Feria "Feria Nueva" creada/)).toBeInTheDocument();
        expect(crearFeria).toHaveBeenCalledWith("Feria Nueva", 5, "tok");
        expect(onCambio).toHaveBeenCalledTimes(1);
        expect(screen.queryByLabelText("Nombre de la feria")).not.toBeInTheDocument();
    });

    it("un nombre en blanco no se envía", () => {
        montar();
        abrirFormulario();

        fireEvent.change(screen.getByLabelText("Nombre de la feria"), { target: { value: "   " } });
        fireEvent.submit(screen.getByLabelText("Nombre de la feria").closest("form"));

        expect(screen.getByRole("alert")).toHaveTextContent("El nombre de la feria es obligatorio.");
        expect(crearFeria).not.toHaveBeenCalled();
    });

    it("si falla la creación muestra el error", async () => {
        crearFeria.mockRejectedValue(new Error("Ya existe una feria con ese nombre."));
        montar();
        abrirFormulario();

        fireEvent.change(screen.getByLabelText("Nombre de la feria"), { target: { value: "Repetida" } });
        fireEvent.click(screen.getByRole("button", { name: "Crear feria" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe una feria con ese nombre.");
        expect(onCambio).not.toHaveBeenCalled();
    });
});

describe("GestionFerias: renombrar", () => {
    function editar(nombre) {
        fireEvent.click(screen.getByRole("button", { name: `Editar el nombre de ${nombre}` }));
        return screen.getByLabelText("Nuevo nombre de la feria");
    }

    it("al editar aparece el campo con el nombre actual", () => {
        montar();

        expect(editar("Feria Andina")).toHaveValue("Feria Andina");
    });

    it("guarda el nuevo nombre y refresca", async () => {
        montar();
        const campo = editar("Feria Andina");

        fireEvent.change(campo, { target: { value: "  Andina 2026 " } });
        fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

        expect(await screen.findByText('Feria renombrada a "Andina 2026".')).toBeInTheDocument();
        expect(actualizarFeria).toHaveBeenCalledWith(1, "Andina 2026", "tok");
        expect(onCambio).toHaveBeenCalledTimes(1);
        expect(screen.queryByLabelText("Nuevo nombre de la feria")).not.toBeInTheDocument();
    });

    it("no guarda un nombre vacío", () => {
        montar();
        const campo = editar("Feria Andina");

        fireEvent.change(campo, { target: { value: " " } });
        fireEvent.submit(campo.closest("form"));

        expect(screen.getByRole("alert")).toHaveTextContent("El nombre de la feria es obligatorio.");
        expect(actualizarFeria).not.toHaveBeenCalled();
    });

    it("si falla muestra el error y se queda editando", async () => {
        actualizarFeria.mockRejectedValue(new Error("No se pudo renombrar."));
        montar();
        editar("Feria Andina");

        fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo renombrar.");
        expect(screen.getByLabelText("Nuevo nombre de la feria")).toBeInTheDocument();
    });

    it("cancelar descarta la edición", () => {
        montar();
        editar("Feria Andina");

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(screen.queryByLabelText("Nuevo nombre de la feria")).not.toBeInTheDocument();
        expect(actualizarFeria).not.toHaveBeenCalled();
    });
});

describe("GestionFerias: estado", () => {
    it("desactivar pide confirmación y desactiva al confirmar", async () => {
        montar([andina]);

        fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));
        const dialogo = screen.getByRole("dialog");
        expect(within(dialogo).getByText(/"Feria Andina" y sus ediciones dejarán de mostrarse/)).toBeInTheDocument();
        fireEvent.click(within(dialogo).getByRole("button", { name: "Desactivar" }));

        await waitFor(() => expect(cambiarEstadoFeria).toHaveBeenCalledWith(1, false, "tok"));
        expect(await screen.findByText(/Feria "Feria Andina" desactivada/)).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("cancelar la confirmación no desactiva", () => {
        montar([andina]);
        fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(cambiarEstadoFeria).not.toHaveBeenCalled();
    });

    it("reactivar no pide confirmación", async () => {
        montar([navidena]);

        fireEvent.click(screen.getByRole("button", { name: "Reactivar" }));

        await waitFor(() => expect(cambiarEstadoFeria).toHaveBeenCalledWith(2, true, "tok"));
        expect(await screen.findByText('Feria "Feria Navideña" reactivada.')).toBeInTheDocument();
    });

    it("si falla muestra el error", async () => {
        cambiarEstadoFeria.mockRejectedValue(new Error("Sin permiso."));
        montar([navidena]);

        fireEvent.click(screen.getByRole("button", { name: "Reactivar" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Sin permiso.");
    });
});
